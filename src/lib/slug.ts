// ============================================================================
// Slug helpers — dipakai untuk URL halaman case study /work/<slug>.
// ============================================================================

/**
 * Ubah judul menjadi slug yang aman untuk URL.
 * Hanya a-z, 0-9, dan tanda hubung; dijahit dari karakter alfanumerik.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    // buang tanda diakritik (é → e)
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Validasi slug yang datang dari URL / form admin.
 * Sengaja ketat: tidak boleh ada "/" atau ".." agar tidak bisa keluar
 * dari pola route.
 */
export function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 80;
}
