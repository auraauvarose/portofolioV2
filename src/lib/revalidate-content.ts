import { revalidateTag } from "next/cache";
import { CACHE_TAGS, type CacheTag } from "@/lib/supabase/public";

export function invalidate(...tags: CacheTag[]): void {
  for (const tag of tags) {
    try {
      revalidateTag(tag);
    } catch (err) {
      console.warn(`revalidateTag(${tag}) gagal:`, err);
    }
  }
}

export function invalidateTable(table: string): void {
  const map: Record<string, CacheTag> = {
    projects: CACHE_TAGS.projects,
    certifications: CACHE_TAGS.certifications,
    gallery_photos: CACHE_TAGS.gallery,
    experience: CACHE_TAGS.experience,
    testimonials: CACHE_TAGS.testimonials,
  };
  const tag = map[table];
  if (tag) invalidate(tag);
}
