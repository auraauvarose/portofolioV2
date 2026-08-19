import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service-role key.
 * Bypasses Row Level Security — use ONLY inside authed Route Handlers/Server
 * Actions (guarded by the admin cookie) to perform writes. Never import this
 * into a client component or expose the key to the browser.
 */
export async function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not configured.",
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
