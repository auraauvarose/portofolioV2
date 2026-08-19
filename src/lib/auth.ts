import { createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Returns the authenticated user, or a 401 NextResponse if no session.
 */
export async function requireUser() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  return { user, error: null };
}
