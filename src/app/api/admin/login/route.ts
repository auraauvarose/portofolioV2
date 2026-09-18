import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, setAdminCookie } from "@/lib/admin-auth";
import { adminPassword } from "@/lib/server-config";

export const dynamic = "force-dynamic";

// ============================================================================
// Rate limit login — memperlambat brute-force password.
//
// CATATAN PENTING: penyimpanan ini in-memory per isolate. Di Cloudflare
// Workers, isolate bisa didaur ulang dan ada banyak isolate, jadi angka di
// bawah BUKAN batas keras. Ini tetap menaikkan biaya serangan secara
// signifikan, tapi pertahanan utama tetap:
//   1. ADMIN_PASSWORD panjang & acak (jangan kata yang bisa ditebak),
//   2. Cloudflare WAF rate-limiting rule pada /api/admin/login.
// Lihat README → Security.
// ============================================================================

/** Jendela waktu & ambang percobaan gagal. */
const WINDOW_MS = 15 * 60_000; // 15 menit
const MAX_ATTEMPTS = 8;

type Bucket = { count: number; first: number; blockedUntil: number };
const attempts = new Map<string, Bucket>();

/** IP asli di Cloudflare — header bisa dipalsukan klien. */
function clientIp(req: NextRequest): string {
  const cf = (req as NextRequest & { cf?: { clientIp?: string } }).cf;
  if (cf?.clientIp) return cf.clientIp;
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

/** Sisa waktu blokir (detik), atau 0 bila tidak diblokir. */
function blockedFor(key: string): number {
  const b = attempts.get(key);
  if (!b) return 0;
  const now = Date.now();
  if (b.blockedUntil > now) return Math.ceil((b.blockedUntil - now) / 1000);
  return 0;
}

/** Catat percobaan gagal; kunci bila melewati ambang. */
function recordFailure(key: string): void {
  const now = Date.now();
  const b = attempts.get(key);

  if (!b || now - b.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: now, blockedUntil: 0 });
  } else {
    b.count += 1;
    if (b.count >= MAX_ATTEMPTS) {
      // Blokir makin lama seiring percobaan berlanjut.
      const factor = Math.min(b.count - MAX_ATTEMPTS + 1, 6);
      b.blockedUntil = now + WINDOW_MS * factor;
    }
  }

  // Cegah map tumbuh tanpa batas.
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
  // Fail-closed: if the server has no ADMIN_PASSWORD secret, logins are
  // impossible until it is configured (never falls back to a default).
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
    // Body bukan JSON — diperlakukan sebagai password kosong.
  }

  const password = typeof body.password === "string" ? body.password : "";

  if (!verifyAdminPassword(password)) {
    recordFailure(ip);
    return NextResponse.json({ error: "Password salah." }, { status: 401 });
  }

  // Berhasil → bersihkan riwayat gagal untuk IP ini.
  clearFailures(ip);

  // Secure flag from the actual request protocol (NODE_ENV is not guaranteed
  // on the Workers runtime).
  await setAdminCookie(req.nextUrl.protocol === "https:");
  return NextResponse.json({ ok: true });
}
