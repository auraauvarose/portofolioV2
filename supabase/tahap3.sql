-- ============================================================================
-- Portfolio V2 — Migrasi Tahap 3
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
--
-- Menambahkan:
--   1. Tabel site_content  — konten situs yang bisa diedit dari admin
--   2. Tabel experience    — riwayat kerja / organisasi
--   3. Tabel testimonials  — social proof
--
-- Aman dijalankan berulang kali (idempotent) dan tidak menghapus data.
-- ============================================================================

-- ============================================================================
-- 1. SITE CONTENT
--
-- Satu baris per seksi, isinya JSONB dengan bentuk yang SAMA seperti objek di
-- src/lib/config.ts. Penyimpanan per-seksi (bukan satu blob besar) supaya:
--   - dua admin mengedit seksi berbeda tidak saling menimpa,
--   - satu seksi rusak tidak menjatuhkan seluruh situs.
--
-- Kunci yang dikenal: profile, hero, about, whatIDo, education, techStack.
-- Seksi yang tidak ada di tabel ini otomatis memakai default dari config.ts,
-- jadi situs tetap tampil utuh walau tabelnya masih kosong.
-- ============================================================================
create table if not exists public.site_content (
  key        text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 2. EXPERIENCE
-- ============================================================================
create table if not exists public.experience (
  id             uuid primary key default gen_random_uuid(),
  role_en        text not null,
  role_id        text not null,
  company        text not null,
  location       text,
  -- Teks bebas supaya fleksibel ("2024", "Jan 2024", "2023 - 2024").
  period         text,
  current        boolean not null default false,
  description_en text,
  description_id text,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists experience_sort_idx
  on public.experience (sort_order);

-- ============================================================================
-- 3. TESTIMONIALS
-- ============================================================================
create table if not exists public.testimonials (
  id         uuid primary key default gen_random_uuid(),
  quote_en   text not null,
  quote_id   text,
  author     text not null,
  role       text,
  company    text,
  avatar_url text,
  link       text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists testimonials_sort_idx
  on public.testimonials (sort_order);

-- ============================================================================
-- 4. PAGE VIEWS (analytics tanpa cookie)
--
-- Tidak menyimpan IP mentah atau user-agent — hanya hash ber-salt, dipakai
-- untuk menghitung kunjungan unik. Tidak ada cookie/ID pelacak.
-- ============================================================================
create table if not exists public.page_views (
  id           bigint generated always as identity primary key,
  path         text not null,
  referrer     text,
  visitor_hash text,
  created_at   timestamptz not null default now()
);

create index if not exists page_views_created_idx on public.page_views (created_at desc);
create index if not exists page_views_path_idx    on public.page_views (path);

-- ============================================================================
-- RLS
--
-- experience & testimonials: konten publik → boleh dibaca anon, tulis lewat
-- API admin (service_role mem-bypass RLS).
--
-- site_content: juga konten publik (teks situs), jadi boleh dibaca anon.
-- ============================================================================
alter table public.site_content  enable row level security;
alter table public.experience    enable row level security;
alter table public.testimonials  enable row level security;
-- page_views: TIDAK boleh dibaca publik. Isinya statistik internal.
alter table public.page_views    enable row level security;

drop policy if exists "site_content_public_read" on public.site_content;
create policy "site_content_public_read" on public.site_content
  for select to anon, authenticated using (true);

drop policy if exists "experience_public_read" on public.experience;
create policy "experience_public_read" on public.experience
  for select to anon, authenticated using (true);

drop policy if exists "testimonials_public_read" on public.testimonials;
create policy "testimonials_public_read" on public.testimonials
  for select to anon, authenticated using (true);

-- SELECT saja; tulis hanya via service_role.
grant select on public.site_content, public.experience, public.testimonials
  to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public.site_content, public.experience, public.testimonials
  from anon, authenticated;

-- page_views: RLS aktif tanpa policy + cabut semua grant = tertutup total.
-- Hanya API admin (service_role) yang bisa membaca/menulis.
revoke all on public.page_views from anon, authenticated;

-- ============================================================================
-- Seed pengalaman (hanya bila tabel masih kosong)
-- ============================================================================
insert into public.experience (role_en, role_id, company, location, period, current, description_en, description_id, sort_order)
select * from (values
  ('Freelance Web Developer', 'Pengembang Web Freelance', 'Self-employed', 'Indonesia', '2024 - Present', true,
   'Building responsive websites and web apps for clients — from design handoff to deployment.',
   'Membangun website dan aplikasi web responsif untuk klien — dari desain hingga deploy.', 0),
  ('Informatics Student', 'Mahasiswa Informatika', 'University', 'Indonesia', '2025 - Present', true,
   'Pursuing a Bachelor of Informatics while building real projects outside coursework.',
   'Menempuh S1 Informatika sambil membangun proyek nyata di luar perkuliahan.', 1)
) as v(role_en, role_id, company, location, period, current, description_en, description_id, sort_order)
where not exists (select 1 from public.experience);

-- ============================================================================
-- Verifikasi cepat (opsional)
-- ============================================================================
-- select table_name from information_schema.tables
--  where table_schema = 'public'
--    and table_name in ('site_content','experience','testimonials');
