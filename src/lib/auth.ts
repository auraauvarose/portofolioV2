import { requireAdmin } from "@/lib/admin-auth";

/**
 * Admin auth guard for Route Handlers / Server Components.
 * Returns { user, error } — when authed, user is a lightweight marker and
 * error is null; otherwise error is a 401 NextResponse the caller returns.
 */
export async function requireUser() {
  const { error } = await requireAdmin();
  if (error) return { user: null, error };
  return { user: { role: "admin" }, error: null };
}
