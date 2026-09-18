-- ============================================================================
-- Portfolio V2 — Supabase schema
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================================

-- 1. Projects
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  title_en      text not null,
  title_id      text not null,
  description_en text,
  description_id text,
  category      text default 'professional',
  year          text,
  image_url     text,
  link          text,
  repo_url      text,
  alt_text      text,
  slug          text,
  content_en    text,
  content_id    text,
  tech_stack    text[] not null default '{}',
  sort_order    integer not null default 0,
  featured      boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Slug unik untuk halaman case study /work/<slug>; NULL = belum dipublikasikan
create unique index if not exists projects_slug_unique
  on public.projects (slug)
  where slug is not null;

-- ---------------------------------------------------------------------------
-- 2. Certifications
-- ---------------------------------------------------------------------------
create table if not exists public.certifications (
  id            uuid primary key default gen_random_uuid(),
  title_en      text not null,
  title_id      text not null,
  issuer        text,
  category      text not null default 'professional', -- internship | professional | technical
  date          text,
  description_en text,
  description_id text,
  image_url     text,
  alt_text      text,
  credential_url text,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Gallery photos
-- ---------------------------------------------------------------------------
create table if not exists public.gallery_photos (
  id            uuid primary key default gen_random_uuid(),
  title_en      text,
  title_id      text,
  image_url     text not null,
  alt_text      text,
  category      text default 'general',
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Contact messages (inbox form kontak)
-- ---------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  subject    text,
  message    text not null,
  budget     text,
  -- new | read | replied | archived
  status     text not null default 'new'
             check (status in ('new', 'read', 'replied', 'archived')),
  ip_hash    text,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx
  on public.contact_messages (created_at desc);
create index if not exists contact_messages_status_idx
  on public.contact_messages (status);

-- ---------------------------------------------------------------------------
-- 5. Site content (konten situs yang bisa diedit dari admin)
--    Satu baris per seksi; isinya JSONB dengan bentuk sama seperti config.ts.
-- ---------------------------------------------------------------------------
create table if not exists public.site_content (
  key        text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. Experience
-- ---------------------------------------------------------------------------
create table if not exists public.experience (
  id             uuid primary key default gen_random_uuid(),
  role_en        text not null,
  role_id        text not null,
  company        text not null,
  location       text,
  period         text,
  current        boolean not null default false,
  description_en text,
  description_id text,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists experience_sort_idx on public.experience (sort_order);

-- ---------------------------------------------------------------------------
-- 7. Testimonials
-- ---------------------------------------------------------------------------
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

create index if not exists testimonials_sort_idx on public.testimonials (sort_order);

-- ---------------------------------------------------------------------------
-- 8. Page views (analytics tanpa cookie; TIDAK dibaca publik)
-- ---------------------------------------------------------------------------
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
-- Row Level Security
-- Public (anon) can READ. All WRITES go through the server-side API routes
-- using the service_role key, which BYPASSES RLS — so there is intentionally
-- no write policy for anon/authenticated.
--
-- SECURITY: do NOT add `for all to authenticated` policies. The app does not
-- use Supabase Auth; anyone able to self-signup through the public GoTrue
-- endpoint would get full write access (and read of private columns) with
-- such policies. Keep signup disabled in Dashboard → Authentication →
-- Sign Up / Providers → disable, and run the revokes below on old databases.
-- ============================================================================
alter table public.projects         enable row level security;
alter table public.certifications   enable row level security;
alter table public.gallery_photos   enable row level security;
-- contact_messages: RLS aktif TANPA policy apa pun = tertutup total untuk anon.
-- Isinya email & pesan privat; hanya bisa diakses lewat API route admin.
alter table public.contact_messages enable row level security;
-- Tahap 3: konten situs & social proof — publik boleh baca, tulis via admin.
alter table public.site_content enable row level security;
alter table public.experience   enable row level security;
alter table public.testimonials enable row level security;
alter table public.page_views   enable row level security;

-- Public read
drop policy if exists "projects_public_read" on public.projects;
create policy "projects_public_read" on public.projects
  for select to anon, authenticated using (true);
drop policy if exists "certifications_public_read" on public.certifications;
create policy "certifications_public_read" on public.certifications
  for select to anon, authenticated using (true);
drop policy if exists "gallery_public_read" on public.gallery_photos;
create policy "gallery_public_read" on public.gallery_photos
  for select to anon, authenticated using (true);

-- Table privileges: SELECT only for anon/authenticated; no write grants.
grant  select on public.projects, public.certifications, public.gallery_photos
  to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public.projects, public.certifications, public.gallery_photos
  from anon, authenticated;

-- contact_messages: cabut SEMUA akses dari anon/authenticated.
revoke all on public.contact_messages from anon, authenticated;

-- Tahap 3: baca publik untuk konten situs & social proof.
drop policy if exists "site_content_public_read" on public.site_content;
create policy "site_content_public_read" on public.site_content
  for select to anon, authenticated using (true);
drop policy if exists "experience_public_read" on public.experience;
create policy "experience_public_read" on public.experience
  for select to anon, authenticated using (true);
drop policy if exists "testimonials_public_read" on public.testimonials;
create policy "testimonials_public_read" on public.testimonials
  for select to anon, authenticated using (true);

grant select on public.site_content, public.experience, public.testimonials
  to anon, authenticated;

-- page_views: tertutup total untuk anon (statistik internal).
revoke all on public.page_views from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public.site_content, public.experience, public.testimonials
  from anon, authenticated;

-- Drop the legacy permissive write policies if they exist (idempotent).
drop policy if exists "projects_admin_write"       on public.projects;
drop policy if exists "certifications_admin_write" on public.certifications;
drop policy if exists "gallery_admin_write"        on public.gallery_photos;

-- ============================================================================
-- Optional: seed data (safe to run — only inserts if tables are empty)
-- ============================================================================
insert into public.projects (title_en, title_id, description_en, description_id, category, year, tech_stack, sort_order, featured)
select * from (values
  ('Portfolio Dashboard', 'Dasbor Portofolio',
   'A creative and interactive developer portfolio with custom accent synchronization, terminal shells, live committing timeline feeds, and a clean responsive layout architecture.',
   'Portofolio developer yang kreatif dan interaktif dengan sinkronisasi aksen kustom, shell terminal, umpan timeline komit live, dan arsitektur layout responsif yang bersih.',
   'professional', '2025', array['Next.js','React','Supabase','Tailwind'], 1, true),
  ('Retro Game Arcade Hub', 'Hub Game Arcade Retro',
   'An interactive 2D web arcade cabinet hosting Tetris, Snake, and Memory cards. Equipped with a synchronized global leaderboard and robust offline cache fallbacks.',
   'Kabinet arcade web 2D interaktif yang menampilkan game Tetris, Snake, dan Memory. Dilengkapi papan peringkat global yang tersinkronisasi dan fallback cache offline yang andal.',
   'professional', '2025', array['React','JavaScript','LocalStorage'], 2, true)
) as v(title_en, title_id, description_en, description_id, category, year, tech_stack, sort_order, featured)
where not exists (select 1 from public.projects);

insert into public.certifications (title_en, title_id, issuer, category, date, description_en, description_id, sort_order)
select * from (values
  ('Frontend Web Developer Specialist', 'Spesialis Pengembang Web Frontend',
   'IT Certification Board', 'professional', '2025',
   'Certified in modern frontend web development including HTML, CSS, JavaScript, React.js, and responsive design best practices.',
   'Bersertifikat dalam pengembangan web frontend modern termasuk HTML, CSS, JavaScript, React.js, dan praktik terbaik desain responsif.',
   1),
  ('Database Engineering & Systems Administrator', 'Rekayasa Database & Administrator Sistem',
   'Linux Professional Institute', 'professional', '2025',
   'Certified in database management systems and Linux systems administration, covering PostgreSQL, SQL, and server administration.',
   'Bersertifikat dalam manajemen sistem basis data dan administrasi sistem Linux, mencakup PostgreSQL, SQL, dan administrasi server.',
   2)
) as v(title_en, title_id, issuer, category, date, description_en, description_id, sort_order)
where not exists (select 1 from public.certifications);
