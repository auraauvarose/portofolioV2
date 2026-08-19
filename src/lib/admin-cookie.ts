// Edge-safe helpers for the admin session cookie.
// This module must NOT import next/headers or any server runtime — it is
// imported by both middlewares (Edge) and server code (Node) so the hashing
// math stays identical on both sides.

export const ADMIN_COOKIE = "admin_session";

/**
 * Derive the session cookie value from the configured secret + password.
 * Uses the same algorithm on the server and in the Edge middleware.
 */
export function computeSessionValue(secret: string): string {
  if (!secret) return "";
  let h = 0;
  for (let i = 0; i < secret.length; i++) {
    h = (Math.imul(31, h) + secret.charCodeAt(i)) | 0;
  }
  return `admin-${(h >>> 0).toString(36)}`;
}
