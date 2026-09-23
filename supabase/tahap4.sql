-- ============================================================================
-- Analitik: perangkat, jam, lokasi
--
-- Menambah 3 kolom ke public.page_views:
--   device   — 'mobile' | 'tablet' | 'desktop' (dari user-agent, UA dibuang)
--   country  — kode negara 2 huruf dari geolokasi Cloudflare (mis. 'ID')
--   city     — nama kota kasar dari geolokasi Cloudflare (mis. 'Jakarta')
--
-- Privasi tetap: tanpa IP mentah, tanpa koordinat, tanpa user-agent tersimpan.
-- Aman dijalankan berulang (idempotent).
-- ============================================================================

alter table public.page_views add column if not exists device  text;
alter table public.page_views add column if not exists country text;
alter table public.page_views add column if not exists city    text;
