// ============================================================================
// SERVER-ONLY auth config. NEVER import this module from a "use client" file
// (or anything bundled to the browser) — its values must not leak.
//
// Env is read per call, not at module scope, so the Worker always sees the
// runtime environment regardless of when this module is first evaluated.
// ============================================================================

/** Admin password, or "" when unset. Empty password ⇒ admin login disabled
 *  (fail-closed). There is intentionally NO default password anymore. */
export function adminPassword(): string {
  return (process.env.ADMIN_PASSWORD ?? "").trim();
}

/**
 * Key for the admin session token (HMAC-SHA256, see admin-cookie.ts).
 * Prefers the dedicated ADMIN_COOKIE_SECRET; falls back to the password.
 * Rotating this value revokes every outstanding admin session.
 */
export function sessionSecret(): string {
  return process.env.ADMIN_COOKIE_SECRET?.trim() || adminPassword();
}
