import { createClient } from "@supabase/supabase-js";

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
