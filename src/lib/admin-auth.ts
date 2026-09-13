import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { adminPassword, sessionSecret } from "@/lib/server-config";
import {
  ADMIN_COOKIE,
  SESSION_TTL_SECONDS,
  createSessionValue,
  verifySessionValue,
} from "@/lib/admin-cookie";

export { ADMIN_COOKIE };

export function verifyAdminPassword(password: string): boolean {
  const b = adminPassword();
  // Fail-closed: no password configured ⇒ admin login is disabled.
  if (!b) return false;
  const a = String(password).trim();
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return verifySessionValue(sessionSecret(), store.get(ADMIN_COOKIE)?.value);
}

/**
 * Issue an admin session cookie.
 * `secure` must be derived from the REQUEST (https), not process.env.NODE_ENV,
 * which is not guaranteed on the Workers runtime.
 */
export async function setAdminCookie(secure: boolean): Promise<void> {
  const secret = sessionSecret();
  if (!secret) return; // guarded by login route; belt & suspenders
  const value = await createSessionValue(secret);
  if (!value) return;
  const store = await cookies();
  store.set(ADMIN_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function requireAdmin() {
  if (await isAdmin()) return { error: null };
  return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
}
