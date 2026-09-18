import { deleteR2Object } from "@/lib/r2";
import type { createSupabaseAdmin } from "@/lib/supabase/admin";

// ============================================================================
// Pembersihan objek R2 yatim.
//
// MASALAH: setiap upload menghasilkan file baru di R2 dengan key unik
// (timestamp + uuid). Ketika admin mengganti gambar atau menghapus entri,
// baris database hilang tapi file lamanya tetap ada — jadi bucket terus
// membengkak dan biaya naik diam-diam.
//
// PENDEKATAN: hapus file lama HANYA setelah operasi database berhasil, dan
// jangan pernah menggagalkan permintaan kalau penghapusan file gagal. Baris
// database adalah sumber kebenaran; file yatim jauh lebih ringan dampaknya
// daripada entri yang gagal tersimpan.
//
// PENGAMAN (penting — ini kode destruktif):
//   1. Hanya URL yang berada di bawah NEXT_PUBLIC_R2_PUBLIC_URL yang boleh
//      dihapus. Gambar eksternal (URL dari situs lain) tidak disentuh.
//   2. File yang masih direferensikan baris lain TIDAK dihapus.
//   3. Semua kegagalan ditelan & dicatat — tidak pernah melempar ke pemanggil.
// ============================================================================

type SupabaseAdmin = Awaited<ReturnType<typeof createSupabaseAdmin>>;

/** Tabel & kolom yang berisi gambar R2 — dipakai untuk cek referensi. */
export type ImageColumn =
  | { table: "projects"; column: "image_url" }
  | { table: "certifications"; column: "image_url" }
  | { table: "gallery_photos"; column: "image_url" };

/** Ubah URL publik R2 menjadi object key, atau null bila bukan milik kita. */
export function keyFromPublicUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  if (!base) return null;

  const cleanBase = base.replace(/\/+$/, "");
  if (!url.startsWith(`${cleanBase}/`)) return null;

  const key = url.slice(cleanBase.length + 1);
  // Buang query/hash dan tolak key kosong atau yang mencoba keluar folder.
  const bare = key.split("?")[0].split("#")[0];
  if (!bare || bare.includes("..")) return null;

  try {
    return decodeURIComponent(bare);
  } catch {
    return null;
  }
}

/**
 * Hapus `url` dari R2 bila sudah tidak direferensikan baris lain.
 * Selalu selesai tanpa melempar — aman dipanggil setelah operasi DB sukses.
 */
export async function deleteR2IfUnreferenced(
  supabase: SupabaseAdmin,
  { table, column }: ImageColumn,
  url: string | null | undefined,
): Promise<void> {
  const key = keyFromPublicUrl(url);
  if (!key) return; // bukan milik bucket kita → jangan disentuh

  try {
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .eq(column, url as string)
      .limit(1);

    if (error) {
      console.error(`r2 cleanup: gagal cek referensi ${table}.${column}:`, error.message);
      return;
    }
    // Masih ada baris lain yang memakai file ini → biarkan.
    if (data && data.length > 0) return;

    await deleteR2Object(key);
  } catch (err) {
    // Kegagalan hapus file TIDAK boleh menggagalkan operasi utama.
    console.error("r2 cleanup: gagal menghapus objek:", err);
  }
}
