-- ============================================================================
-- Portfolio V2 — Migrasi Tahap 1
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
--
-- Menambahkan:
--   1. Kolom case study pada projects (slug, konten, alt text, repo)
--   2. Kolom alt text + credential URL pada certifications
--   3. Kolom alt text pada gallery_photos
--   4. Tabel contact_messages (inbox form kontak)
--
-- Aman dijalankan berulang kali (idempotent) dan tidak menghapus data.
-- ============================================================================

-- ============================================================================
-- 1. PROJECTS — case study
-- ============================================================================
-- slug: dipakai untuk URL /work/<slug>. NULL = project belum punya halaman
--       case study (kartu tetap tampil, tapi tanpa tautan "baca selengkapnya").
alter table public.projects add column if not exists slug       text;
-- konten panjang halaman case study (teks biasa; pisahkan paragraf dengan
-- baris kosong). Markdown tidak diparsing — lihat catatan di README.
alter table public.projects add column if not exists content_en text;
alter table public.projects add column if not exists content_id text;
-- alt text gambar — dipakai untuk aksesibilitas & SEO gambar
alter table public.projects add column if not exists alt_text   text;
-- tautan repositori (opsional, terpisah dari link demo)
alter table public.projects add column if not exists repo_url   text;

-- Slug harus unik, tapi banyak baris boleh NULL (belum diisi).
create unique index if not exists projects_slug_unique
  on public.projects (slug)
  where slug is not null;

-- Backfill slug dari title_en untuk baris lama yang belum punya slug,
-- supaya halaman case study bisa langsung dipakai setelah migrasi.
update public.projects
set slug = trim(both '-' from regexp_replace(lower(title_en), '[^a-z0-9]+', '-', 'g'))
where slug is null
  and title_en is not null
  and trim(both '-' from regexp_replace(lower(title_en), '[^a-z0-9]+', '-', 'g')) <> '';

-- ============================================================================
-- 2. CERTIFICATIONS — alt text + verifikasi kredensial
-- ============================================================================
alter table public.certifications add column if not exists alt_text       text;
-- credential_url: tautan verifikasi resmi dari penerbit sertifikat
alter table public.certifications add column if not exists credential_url text;

-- ============================================================================
-- 3. GALLERY — alt text
-- ============================================================================
alter table public.gallery_photos add column if not exists alt_text text;

-- ============================================================================
-- 4. CONTACT MESSAGES — inbox form kontak
-- ============================================================================
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text,
  message    text not null,
  -- opsional: rentang anggaran yang dipilih pengirim
  budget     text,
  -- new | read | replied | archived
  status     text not null default 'new'
             check (status in ('new', 'read', 'replied', 'archived')),
  -- jejak audit ringan untuk spam
  ip_hash    text,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);
create index if not exists contact_messages_status_idx
  on public.contact_messages (status);

-- ============================================================================
-- RLS — contact_messages
--
-- PENTING: tabel ini TIDAK boleh bisa dibaca publik. Isinya email & pesan
-- privat pengirim. Semua akses (insert dari form, baca dari admin) melewati
-- API route server-side memakai service_role, yang mem-bypass RLS.
-- Jadi: RLS aktif + TIDAK ADA policy sama sekali = tertutup untuk anon.
-- ============================================================================
alter table public.contact_messages enable row level security;

revoke all on public.contact_messages from anon, authenticated;

-- ============================================================================
-- Verifikasi cepat (opsional — jalankan untuk memastikan kolom sudah ada)
-- ============================================================================
-- select column_name, data_type
--   from information_schema.columns
--  where table_schema = 'public'
--    and table_name in ('projects','certifications','gallery_photos','contact_messages')
--  order by table_name, ordinal_position;
