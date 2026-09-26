import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, setAdminCookie } from "@/lib/admin-auth";
import { adminPassword } from "@/lib/server-config";

export const dynamic = "force-dynamic";

const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 8;

type Bucket = { count: number; first: number; blockedUntil: number };
const attempts = new Map<string, Bucket>();

function clientIp(req: NextRequest): string {
  const cf = (req as NextRequest & { cf?: { clientIp?: string } }).cf;
  if (cf?.clientIp) return cf.clientIp;
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function blockedFor(key: string): number {
  const b = attempts.get(key);
  if (!b) return 0;
  const now = Date.now();
  if (b.blockedUntil > now) return Math.ceil((b.blockedUntil - now) / 1000);
  return 0;
}

function recordFailure(key: string): void {
  const now = Date.now();
  const b = attempts.get(key);

  if (!b || now - b.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: now, blockedUntil: 0 });
  } else {
    b.count += 1;
    if (b.count >= MAX_ATTEMPTS) {
      const factor = Math.min(b.count - MAX_ATTEMPTS + 1, 6);
      b.blockedUntil = now + WINDOW_MS * factor;
    }
  }

  if (attempts.size > 5000) {
    const cutoff = now - WINDOW_MS;
    for (const [k, v] of attempts) {
      if (v.first < cutoff && v.blockedUntil < now) attempts.delete(k);
    }
  }
}

function clearFailures(key: string): void {
  attempts.delete(key);
}

export async function POST(req: NextRequest) {
  if (!adminPassword()) {
    return NextResponse.json(
      { error: "Login admin belum dikonfigurasi di server (ADMIN_PASSWORD)." },
      { status: 503 },
    );
  }

  const ip = clientIp(req);

  const wait = blockedFor(ip);
  if (wait > 0) {
    return NextResponse.json(
      {
        error: `Terlalu banyak percobaan gagal. Coba lagi dalam ${Math.ceil(
          wait / 60,
        )} menit.`,
      },
      { status: 429, headers: { "Retry-After": String(wait) } },
    );
  }

  let body: { password?: unknown } = {};
  try {
    body = await req.json();
  } catch {
  }

  const password = typeof body.password === "string" ? body.password : "";

  if (!verifyAdminPassword(password)) {
    recordFailure(ip);
    return NextResponse.json({ error: "Password salah." }, { status: 401 });
  }

  clearFailures(ip);

  await setAdminCookie(req.nextUrl.protocol === "https:");
  return NextResponse.json({ ok: true });
}
