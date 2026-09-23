-- ============================================================================
-- Analitik: browser & merek ponsel
--
-- Menambah 2 kolom ke public.page_views:
--   browser      — 'Chrome' | 'Firefox' | 'Safari' | 'Edge' | 'Opera' |
--                  'Samsung Internet' | 'Lainnya' (dari user-agent, UA dibuang)
--   phone_brand  — 'Samsung' | 'Xiaomi' | 'Apple' | ... (khusus perangkat
--                  mobile; NULL untuk desktop/tablet karena tidak punya merek)
--
-- Privasi tetap: user-agent tetap tidak disimpan, hanya hasil klasifikasinya.
-- Aman dijalankan berulang (idempotent).
-- ============================================================================

alter table public.page_views add column if not exists browser     text;
alter table public.page_views add column if not exists phone_brand text;
