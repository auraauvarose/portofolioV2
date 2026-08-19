import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_PASSWORD, ADMIN_COOKIE_SECRET } from "@/lib/config";
import { ADMIN_COOKIE, computeSessionValue } from "@/lib/admin-cookie";

export { ADMIN_COOKIE };

/**
 * The exact cookie value we expect to find to consider a request "logged in".
 * Bound to a server-side secret so it isn't trivially forgeable. If no secret
 * is configured we fall back to the admin password itself.
 */
function expectedSessionValue(): string {
  return computeSessionValue(ADMIN_COOKIE_SECRET || ADMIN_PASSWORD);
}

export function verifyAdminPassword(password: string): boolean {
  if (!ADMIN_PASSWORD) return false;
  // Constant-ish time compare to avoid trivial timing leaks.
  const a = String(password);
  const b = String(ADMIN_PASSWORD);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(ADMIN_COOKIE)?.value;
  if (!value) return false;
  return value === expectedSessionValue();
}

export async function setAdminCookie(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, expectedSessionValue(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

/**
 * Guard for Route Handlers / Server Components: returns null when authed,
 * otherwise a 401 NextResponse that the caller should return immediately.
 */
export async function requireAdmin() {
  if (await isAdmin()) return { error: null };
  return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
}
