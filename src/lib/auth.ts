import { requireAdmin } from "@/lib/admin-auth";

export async function requireUser() {
  const { error } = await requireAdmin();
  if (error) return { user: null, error };
  return { user: { role: "admin" }, error: null };
}
