import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, setAdminCookie } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  let body: { password?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // ignore malformed body
  }

  const password = typeof body.password === "string" ? body.password : "";

  if (!verifyAdminPassword(password)) {
    return NextResponse.json(
      { error: "Password salah." },
      { status: 401 },
    );
  }

  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
