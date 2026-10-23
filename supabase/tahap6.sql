-- ============================================================================
-- Analitik: alamat IP pengunjung
--
-- Menambah 1 kolom ke public.page_views:
--   ip — alamat IP klien apa adanya (mis. '103.28.14.77'), dari header
--        `cf-connecting-ip` yang diisi Cloudflare (tidak bisa dipalsukan
--        klien). Dipakai untuk membedakan perangkat pada log kunjungan.
--
-- PRIVASI: ini data pribadi. Tabel page_views sudah tertutup total untuk anon
-- & authenticated (RLS aktif tanpa policy + revoke all), jadi hanya terbaca
-- lewat API route admin memakai service_role.
--
-- Baris lama tetap NULL — tidak bisa di-backfill.
-- Aman dijalankan berulang (idempotent).
-- ============================================================================

alter table public.page_views add column if not exists ip text;
