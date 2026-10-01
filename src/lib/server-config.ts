export function adminPassword(): string {
  return (process.env.ADMIN_PASSWORD ?? "").trim();
}

/**
 * Secret penanda tangan cookie sesi admin.
 *
 * SENGAJA tidak lagi fallback ke ADMIN_PASSWORD. Pesan yang ditandatangani
 * (`admin-session-v1:<exp>`) seluruhnya diketahui penyerang, sehingga fallback
 * itu mengubah satu cookie yang tertangkap menjadi oracle brute-force offline
 * untuk password admin. Bila belum dikonfigurasi, fungsi ini mengembalikan
 * string kosong dan pemanggil WAJIB gagal-tertutup (tidak menerbitkan sesi).
 */
export function sessionSecret(): string {
  return (process.env.ADMIN_COOKIE_SECRET ?? "").trim();
}
