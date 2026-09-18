import { revalidateTag } from "next/cache";
import { CACHE_TAGS, type CacheTag } from "@/lib/supabase/public";

// ============================================================================
// Invalidasi cache konten publik.
//
// Pembacaan publik di-cache dengan tag (lihat src/lib/supabase/public.ts).
// Setelah admin menyimpan, tag terkait dibuang supaya perubahan langsung
// terlihat — tanpa ini, edit baru muncul setelah TTL 5 menit.
//
// Dipanggil setelah operasi database BERHASIL. Aman dipanggil dari route
// handler; tidak berpengaruh bila tidak ada cache yang cocok.
// ============================================================================

/** Buang cache untuk satu atau beberapa tag. Tidak pernah melempar. */
export function invalidate(...tags: CacheTag[]): void {
  for (const tag of tags) {
    try {
      revalidateTag(tag);
    } catch (err) {
      // Gagal invalidasi bukan alasan menggagalkan request admin — data sudah
      // tersimpan, dan TTL jaring pengaman akan menyusul.
      console.warn(`revalidateTag(${tag}) gagal:`, err);
    }
  }
}

/** Invalidate berdasarkan nama tabel (dipakai /api/reorder). */
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
