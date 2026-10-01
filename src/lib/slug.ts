export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    // Pemotongan bisa menyisakan hubung di ujung (mis. 79 huruf + " b").
    // `isValidSlug` menolak bentuk itu, jadi buang SETELAH potong supaya
    // hasilnya selalu idempoten dan selalu bisa dipakai ulang.
    .replace(/-+$/, "");
}

export function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 80;
}

/**
 * Normalisasi slug yang datang dari klien.
 *
 * Sebelumnya slug ditulis mentah ke kolom `slug`, jadi "My Project!" tersimpan
 * apa adanya: UI admin menampilkan tautan `/work/My Project!` sementara
 * pengunjung selalu mendapat 404 karena gerbang `isValidSlug` di halaman detail.
 * Mengembalikan `null` bila input kosong atau tidak menyisakan karakter aman.
 */
export function normalizeSlug(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const text = raw.trim();
  if (!text) return null;
  const slug = slugify(text);
  return isValidSlug(slug) ? slug : null;
}
