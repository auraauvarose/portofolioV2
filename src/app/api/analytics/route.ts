import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, withJsonErrors } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";
import { parseBrowser, parseDevice, parsePhoneBrand } from "@/lib/device";
import { visitLogEntry } from "@/lib/visit-log";
import { withFallback } from "@/lib/db-fallback";

export const dynamic = "force-dynamic";

const MAX_PATH = 200;
const MAX_REF = 120;

const WINDOW_MS = 10_000;
const seen = new Map<string, number>();

function throttled(key: string): boolean {
  const now = Date.now();
  const last = seen.get(key) ?? 0;
  if (now - last < WINDOW_MS) return true;
  seen.set(key, now);
  if (seen.size > 5000) {
    const cutoff = now - WINDOW_MS;
    for (const [k, t] of seen) if (t < cutoff) seen.delete(k);
  }
  return false;
}

function clean(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  return t || null;
}

function clientIp(req: NextRequest): string {
  const cf = (req as NextRequest & { cf?: { clientIp?: string } }).cf;
  if (cf?.clientIp) return cf.clientIp;
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function geoOf(req: NextRequest): { country: string | null; city: string | null } {
  const cf = (
    req as NextRequest & { cf?: { country?: string; city?: string } }
  ).cf;
  return {
    country: cf?.country ? cf.country.slice(0, 2).toUpperCase() : null,
    city: cf?.city ? cf.city.slice(0, 60) : null,
  };
}

async function visitorHash(req: NextRequest): Promise<string | null> {
  const salt = process.env.ADMIN_COOKIE_SECRET || process.env.ADMIN_PASSWORD;
  if (!salt) return null;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(salt),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const material = `${clientIp(req)}|${req.headers.get("user-agent") ?? ""}`;
    const sig = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(material),
    );
    return Array.from(new Uint8Array(sig), (b) =>
      b.toString(16).padStart(2, "0"),
    )
      .join("")
      .slice(0, 32);
  } catch {
    return null;
  }
}

export const POST = withJsonErrors(async function POST(req: NextRequest) {
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "true") {
    return NextResponse.json({ ok: true, disabled: true });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: true });
  }

  const path = clean((body as Record<string, unknown>).path, MAX_PATH);
  if (!path || !path.startsWith("/")) {
    return NextResponse.json({ ok: true });
  }

  const ip = clientIp(req);
  if (throttled(ip)) return NextResponse.json({ ok: true });

  const referrer = clean((body as Record<string, unknown>).referrer, MAX_REF);

  const supabase = await createSupabaseAdmin();
  const geo = geoOf(req);
  const ua = req.headers.get("user-agent");
  const base = {
    path,
    referrer,
    visitor_hash: await visitorHash(req),
  };

  const { ok, error } = await withFallback(
    [
      {
        ...base,
        device: parseDevice(ua),
        browser: parseBrowser(ua),
        phone_brand: parsePhoneBrand(ua),
        country: geo.country,
        city: geo.city,
      },
      {
        ...base,
        device: parseDevice(ua),
        country: geo.country,
        city: geo.city,
      },
      base,
    ],
    async (payload) => await supabase.from("page_views").insert(payload),
  );

  if (!ok) console.warn("analytics insert:", error);
  return NextResponse.json({ ok: true });
});

export const GET = withJsonErrors(async function GET(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const days = Math.min(
    Math.max(Number(new URL(req.url).searchParams.get("days")) || 30, 1),
    365,
  );
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const supabase = await createSupabaseAdmin();

  type Row = {
    path: string;
    referrer: string | null;
    visitor_hash: string | null;
    device?: string | null;
    browser?: string | null;
    phone_brand?: string | null;
    country?: string | null;
    city?: string | null;
    created_at: string;
  };

  const { ok, data, error } = await withFallback<string, Row[]>(
    [
      "path,referrer,visitor_hash,device,browser,phone_brand,country,city,created_at",
      "path,referrer,visitor_hash,device,country,city,created_at",
      "path,referrer,visitor_hash,created_at",
    ],
    async (cols) =>
      (await supabase
        .from("page_views")
        .select(cols)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(20_000)) as unknown as {
        error: unknown;
        data: Row[] | null;
      },
  );

  if (!ok) {
    console.warn("analytics GET:", error);
    return NextResponse.json({
      migrated: false,
      total: 0,
      unique: 0,
      byDay: [],
      topPaths: [],
      topReferrers: [],
      byDevice: [],
      byBrowser: [],
      byPhoneBrand: [],
      byHour: [],
      topLocations: [],
      recentVisits: [],
    });
  }

  const rows = data ?? [];

  const uniques = new Set<string>();
  const pathCount = new Map<string, number>();
  const refCount = new Map<string, number>();
  const dayCount = new Map<string, number>();
  const deviceCount = new Map<string, number>();
  const browserCount = new Map<string, number>();
  const brandCount = new Map<string, number>();
  const hourCount = new Map<number, number>();
  const locCount = new Map<string, number>();

  for (const r of rows) {
    if (r.visitor_hash) uniques.add(r.visitor_hash);
    pathCount.set(r.path, (pathCount.get(r.path) ?? 0) + 1);
    if (r.referrer) refCount.set(r.referrer, (refCount.get(r.referrer) ?? 0) + 1);
    const day = r.created_at.slice(0, 10);
    dayCount.set(day, (dayCount.get(day) ?? 0) + 1);

    if (r.device) {
      deviceCount.set(r.device, (deviceCount.get(r.device) ?? 0) + 1);
    }
    if (r.browser) {
      browserCount.set(r.browser, (browserCount.get(r.browser) ?? 0) + 1);
    }
    if (r.phone_brand) {
      brandCount.set(r.phone_brand, (brandCount.get(r.phone_brand) ?? 0) + 1);
    }
    const hour = (new Date(r.created_at).getUTCHours() + 7) % 24;
    hourCount.set(hour, (hourCount.get(hour) ?? 0) + 1);
    if (r.country || r.city) {
      const loc =
        r.city && r.country ? `${r.city}, ${r.country}` : (r.country ?? "");
      locCount.set(loc, (locCount.get(loc) ?? 0) + 1);
    }
  }

  const top = (m: Map<string | number, number>, n: number) =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([label, count]) => ({ label: String(label), count }));

  return NextResponse.json({
    migrated: true,
    days,
    total: rows.length,
    unique: uniques.size,
    byDay: [...dayCount.entries()]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, count]) => ({ date, count })),
    topPaths: top(pathCount, 8),
    topReferrers: top(refCount, 8),
    byDevice: top(deviceCount, 5),
    byBrowser: top(browserCount, 6),
    byPhoneBrand: top(brandCount, 6),
    byHour: [...hourCount.entries()].sort((a, b) => a[0] - b[0])
      .map(([hour, count]) => ({ hour, count })),
    topLocations: top(locCount, 8),
    recentVisits: rows.slice(0, 20).map((r) =>
      visitLogEntry({
        path: r.path,
        device: r.device ?? null,
        country: r.country ?? null,
        city: r.city ?? null,
        created_at: r.created_at,
      }),
    ),
  });
});
