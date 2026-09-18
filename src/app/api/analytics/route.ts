import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin, withJsonErrors } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ============================================================================
// /api/analytics — pencatatan pageview tanpa cookie & tanpa PII.
//
//   POST  publik   → catat satu pageview
//   GET   admin    → ringkasan (total, per hari, halaman teratas, referrer)
//
// Privasi: IP TIDAK disimpan mentah — hanya HMAC-SHA256 dengan salt rahasia,
// dipotong, dan dipakai semata untuk membedakan kunjungan unik. Tidak ada
// cookie, tidak ada ID pelacak.
// ============================================================================

const MAX_PATH = 200;
const MAX_REF = 120;

/** Rate limit in-memory: cukup untuk meredam spam beacon. */
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

/** Hash IP + user-agent dengan salt; tidak bisa dibalik ke orangnya. */
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

// ---------------------------------------------------------------------------
// POST — catat pageview (publik)
// ---------------------------------------------------------------------------
export const POST = withJsonErrors(async function POST(req: NextRequest) {
  // Nonaktif secara default; aktifkan lewat env agar tidak diam-diam mencatat.
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
  const { error } = await supabase.from("page_views").insert({
    path,
    referrer,
    visitor_hash: await visitorHash(req),
  });

  // Kegagalan pencatatan tidak boleh terlihat oleh pengunjung.
  if (error) console.warn("analytics insert:", error.message);
  return NextResponse.json({ ok: true });
});

// ---------------------------------------------------------------------------
// GET — ringkasan (admin)
// ---------------------------------------------------------------------------
export const GET = withJsonErrors(async function GET(req: NextRequest) {
  const { error: authError } = await requireUser();
  if (authError) return authError;

  const days = Math.min(
    Math.max(Number(new URL(req.url).searchParams.get("days")) || 30, 1),
    365,
  );
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const supabase = await createSupabaseAdmin();
  const { data, error } = await supabase
    .from("page_views")
    .select("path,referrer,visitor_hash,created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(20_000);

  if (error) {
    console.warn("analytics GET:", error.message);
    return NextResponse.json({
      migrated: false,
      total: 0,
      unique: 0,
      byDay: [],
      topPaths: [],
      topReferrers: [],
    });
  }

  const rows = (data ?? []) as {
    path: string;
    referrer: string | null;
    visitor_hash: string | null;
    created_at: string;
  }[];

  const uniques = new Set<string>();
  const pathCount = new Map<string, number>();
  const refCount = new Map<string, number>();
  const dayCount = new Map<string, number>();

  for (const r of rows) {
    if (r.visitor_hash) uniques.add(r.visitor_hash);
    pathCount.set(r.path, (pathCount.get(r.path) ?? 0) + 1);
    if (r.referrer) refCount.set(r.referrer, (refCount.get(r.referrer) ?? 0) + 1);
    const day = r.created_at.slice(0, 10);
    dayCount.set(day, (dayCount.get(day) ?? 0) + 1);
  }

  const top = (m: Map<string, number>, n: number) =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([label, count]) => ({ label, count }));

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
  });
});
