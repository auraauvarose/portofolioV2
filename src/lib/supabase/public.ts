import { createClient } from "@supabase/supabase-js";

/**
 * Klien Supabase untuk BACAAN PUBLIK.
 *
 * Berbeda dengan `createSupabaseServer()` yang membaca cookie lewat
 * `next/headers`, klien ini tidak menyentuh request scope sama sekali. Itu
 * penting karena `generateStaticParams()` dan `sitemap.ts` berjalan di luar
 * request (saat build) — memakai `cookies()` di sana akan gagal dengan
 * "cookies was called outside a request scope".
 *
 * Hanya memakai anon key, jadi tetap tunduk pada RLS: SELECT publik saja.
 * JANGAN pakai klien ini untuk operasi tulis — gunakan createSupabaseAdmin().
 *
 * ## Strategi cache
 *
 * Hasil query di-cache dengan TAG, bukan `no-store`:
 *   - `no-store` akan memaksa SEMUA route yang memakainya jadi dinamis
 *     (termasuk layout, sehingga /admin/login & /_not-found ikut dinamis).
 *   - Dengan tag, halaman tetap bisa di-prerender, dan admin bisa memaksa
 *     data segar seketika lewat `revalidateTag()` setelah menyimpan.
 *
 * TTL di bawah hanya jaring pengaman bila revalidateTag tidak terpanggil.
 */
export const CACHE_TAGS = {
  siteContent: "site-content",
  projects: "projects",
  certifications: "certifications",
  gallery: "gallery",
  experience: "experience",
  testimonials: "testimonials",
  comments: "comments",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

/** TTL jaring pengaman (detik) bila revalidateTag tidak sempat terpanggil. */
const SAFETY_TTL = 300;

export function createSupabasePublic(tags: CacheTag | CacheTag[] = []) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi.",
    );
  }

  const tagList = Array.isArray(tags) ? tags : [tags];

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          next: {
            revalidate: SAFETY_TTL,
            ...(tagList.length > 0 ? { tags: tagList } : {}),
          },
        } as RequestInit),
    },
  });
}
