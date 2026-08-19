import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Wrap an API route handler so unexpected throws (e.g. missing env config)
 * return a readable JSON `{ error }` instead of an HTML 500 that the admin UI
 * silently reduces to a generic "Gagal menyimpan".
 *
 * Also pass through the route context (e.g. `{ params }`) for `[id]` routes.
 */
export function withJsonErrors<C = unknown>(
  handler: (req: NextRequest, context: C) => Promise<NextResponse>,
) {
  return async (req: NextRequest, context: C) => {
    try {
      return await handler(req, context);
    } catch (err) {
      console.error("api error:", err);
      const msg =
        err instanceof Error ? err.message : "Internal server error";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  };
}

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
      "SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local — isi dengan service_role key dari Supabase Dashboard > Project Settings > API.",
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
