import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, setAdminCookie } from "@/lib/admin-auth";
import { adminPassword } from "@/lib/server-config";

export async function POST(req: NextRequest) {
  // Fail-closed: if the server has no ADMIN_PASSWORD secret, logins are
  // impossible until it is configured (never falls back to a default).
  if (!adminPassword()) {
    return NextResponse.json(
      { error: "Login admin belum dikonfigurasi di server (ADMIN_PASSWORD)." },
      { status: 503 },
    );
  }

  let body: { password?: unknown } = {};
  try {
    body = await req.json();
  } catch {
  }

  const password = typeof body.password === "string" ? body.password : "";

  if (!verifyAdminPassword(password)) {
    return NextResponse.json(
      { error: "Password salah." },
      { status: 401 },
    );
  }

  // Secure flag from the actual request protocol (NODE_ENV is not guaranteed
  // on the Workers runtime).
  await setAdminCookie(req.nextUrl.protocol === "https:");
  return NextResponse.json({ ok: true });
}
