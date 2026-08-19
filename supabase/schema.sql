-- ============================================================================
-- Portfolio V2 — Supabase schema
-- Run this whole file in: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Projects (Selected Works)
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
  tech_stack    text[] not null default '{}',
  sort_order    integer not null default 0,
  featured      boolean not null default true,
  created_at    timestamptz not null default now()
);

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
  category      text default 'general',
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security
-- Public (anon) can READ; only authenticated users (the admin) can WRITE.
-- ============================================================================
alter table public.projects         enable row level security;
alter table public.certifications   enable row level security;
alter table public.gallery_photos   enable row level security;

-- Public read
create policy "projects_public_read" on public.projects
  for select using (true);
create policy "certifications_public_read" on public.certifications
  for select using (true);
create policy "gallery_public_read" on public.gallery_photos
  for select using (true);

-- Admin write (insert / update / delete) for any signed-in user
create policy "projects_admin_write" on public.projects
  for all to authenticated using (true) with check (true);
create policy "certifications_admin_write" on public.certifications
  for all to authenticated using (true) with check (true);
create policy "gallery_admin_write" on public.gallery_photos
  for all to authenticated using (true) with check (true);

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
