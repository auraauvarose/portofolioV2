-- ============================================================================
-- Portfolio V2 — Guestbook / Komentar
-- Run in: Supabase Dashboard → SQL Editor → New query → Run
-- Menambahkan tabel public.comments untuk halaman /komentar.
-- ============================================================================

create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text,
  message     text not null,
  -- rating 1..5 (nullable = tanpa rating)
  rating      smallint check (rating between 1 and 5),
  -- banner sementara yang ditandai admin (opsional)
  approved    boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security — publik hanya bisa READ + INSERT terbatas, admin bisa
-- UPDATE/DELETE lewat service_role (API route pakai createSupabaseAdmin).
-- ============================================================================
alter table public.comments enable row level security;

-- Siapa pun boleh membaca komentar
drop policy if exists "comments_public_read" on public.comments;
create policy "comments_public_read" on public.comments
  for select using (true);

-- Pengunjung boleh mengirim komentar (anon insert diperbolehkan);
-- panjang & isi tervalidasi lagi di API route /api/comments.
drop policy if exists "comments_public_insert" on public.comments;
create policy "comments_public_insert" on public.comments
  for insert to anon, authenticated
  with check (char_length(name) between 1 and 60 and char_length(message) between 1 and 1000);

-- Admin (signed-in) boleh menghapus/memoderasi
drop policy if exists "comments_admin_write" on public.comments;
create policy "comments_admin_write" on public.comments
  for delete to authenticated using (true);
