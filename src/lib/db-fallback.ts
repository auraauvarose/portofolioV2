// ============================================================================
// db-fallback — percobaan bertingkat untuk kolom yang mungkin belum ada.
//
// Latar: kode ini menambahkan kolom baru (device/country/city) ke tabel
// page_views, tetapi migrasi SQL-nya dijalankan manual oleh pemilik situs.
// Bila kode di-deploy lebih dulu, query dengan kolom baru gagal SELURUHNYA —
// bukan hanya kolom baru. Untuk INSERT itu berarti pencatatan berhenti total;
// untuk SELECT panel salah melaporkan "tabel belum ada" padahal tabelnya ada.
//
// Helper ini mencoba daftar percobaan berurutan (paling lengkap dulu) dan
// mengembalikan data dari percobaan pertama yang berhasil.
// ============================================================================

export type FallbackResult<T> = {
  ok: boolean;
  attempts: number;
  data?: T;
  error?: string;
};

/**
 * Coba tiap `attempts` berurutan sampai satu berhasil.
 * `run` mengembalikan objek ber-`error`/`data` ala Supabase.
 */
export async function withFallback<A, T>(
  attempts: A[],
  run: (attempt: A) => Promise<{ error: unknown; data?: T | null }>,
): Promise<FallbackResult<T>> {
  let last = "tidak ada percobaan yang dijalankan";
  for (let i = 0; i < attempts.length; i++) {
    const { error, data } = await run(attempts[i]);
    if (!error) {
      return {
        ok: true,
        attempts: i + 1,
        data: data ?? undefined,
      };
    }
    last = errorMessage(error);
  }
  return { ok: false, attempts: attempts.length, error: last };
}

/** Pesan error dari berbagai bentuk objek error, selalu string tak-kosong. */
function errorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const m = (error as { message?: unknown }).message;
    if (typeof m === "string" && m) return m;
  }
  if (typeof error === "string" && error) return error;
  return "query gagal tanpa pesan";
}
