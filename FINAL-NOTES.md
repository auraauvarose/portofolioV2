# Catatan Final — JANGAN DIUBAH

Dokumen ini mencatat keputusan final yang sudah disetujui user. Kalau AI/sesi lain
berencana mengubah hal di bawah ini, JANGAN. Kalau ragu, tanya user dulu.

Scope keputusan desain asli: `src/components/Hero.tsx`, `src/components/HomeClient.tsx`,
hapus-an `CustomCursor.tsx`.

Scope keputusan re-skin + infrastruktur (baru, lihat §4–§6): konten di `src/lib/config.ts`,
seed di `src/lib/data.ts` + `supabase/schema.sql`, `public/`, dan config deploy.

---

## 1. Hero — Orange Lens Disc Cursor Reveal (FINAL)

File: `src/components/Hero.tsx` — efek hero sukses & disetujui. Jangan ganti.

**Perilaku yang harus dipertahankan:**

- Judul besar faded `FULLSTACK / DEVELOPER` (warna `text-black/20`,
  dark `text-[#B7AB98]/20`) tetap tampil.
- Eyebrow nama diambil dinamis dari `profile.name` di `src/lib/config.ts`
  (awalnya `APRIYANTO DWI HERLAMBANG`, sekarang `AURA AUVAROSE`) warna orange
  `text-[#EB5939]`.
- **Disc orange lensa 280px** (`bg-[#EB5939]`) ikut cursor, reveal
  `SOFTWARE / ENGINEER` (teks `text-black`) di dalamnya. Judul dalam disc
  **tetap di tengah viewport** (bukan ikut disc) — teknik lensa.
- Disc cuma muncul saat cursor di atas **teks hero** (container eyebrow+judul,
  handler `onMouseEnter/onMouseLeave` di situ). Keluar dari teks → disc
  animasi balik `scale(0)`, hilang total.
- `onMouseMove` di `<section>` update CSS var `--mx/--my` (client coords) —
  **jangan pakai state/re-render per frame** buat posisi disc.
- Default disc `scale(0)` + posisi offscreen → tidak muncul saat load.
- Disc `hidden lg:block` (mobile tanpa efek).

**Detail teknis (constraint):**

- Konstanta `DISC = 280`; transform disc =
  `translate(calc(var(--mx) - 140px), calc(var(--my) - 140px))`.
- Layer isi disc = `min-w-100vw min-h-100vh` +
  `translate(calc(-1 * var(--mx) + 140px), calc(-1 * var(--my) + 140px))`
  → ini yang bikin judul tetap di tengah. Jangan diubah rumusnya.
- Easing scale: `cubic-bezier(0.34,1.56,0.64,1)` (overshoot), `duration-500`.
- Disc punya `box-shadow` glow orange + highlight radial + `ring-white/20` —
  bagian "dibagusin" yang disetujui. Pertahankan.
- Spacer pill tak terlihat (`mt-4 md:mt-8`, `opacity-0`) di dalam disc wajib ada
  supaya judul dalam disc sejajar dengan judul base (margin HARUS sama dengan
  pill base `mt-4 md:mt-8`).

---

## 2. Custom Cursor Dihapus (FINAL)

- `src/components/CustomCursor.tsx` — **DILARANG dibuat ulang / dipakai lagi.**
- Import & render `<CustomCursor />` sudah dihapus dari `HomeClient.tsx`.
- User mau pakai **kursor mouse biasa** (native), bukan dot+ring custom.
- Jangan tambahkan `cursor: none` di `body` (itu bikin native cursor hilang).

---

## 3. Warna (FINAL)

- Accent orange = `#EB5939` (`--color-accent` di `globals.css`).
- Spotlight/disc orange pakai `bg-[#EB5939]` (bukan `amber`/`yellow`).
- Eyebrow base = `text-[#EB5939]`; teks dalam disc = `text-black`.

---

## 4. Re-skin Aura Auvarose (FINAL)

Proyek V2 adalah **re-skin** dari referensi Apriyanto Dwi Herlambang → milik
**Aura Auvarose**, atas persetujuan user. Desain & struktur asli (lensa hero,
marquee, section, `/admin`) **dipertahankan**; hanya konten yang diganti.

- **Konten statis** kini di `src/lib/config.ts` (bukan hardcode di komponen):
  - `profile.name` = `Aura Auvarose`, `profile.email` = `auraauvaroseendica@gmail.com`,
    `profile.location` = `Indonesia`.
  - Sosial: **Github, Instagram, Email, Discord, TikTok**.
    **LinkedIn DIHAPUS** (belum ada akun asli), **Medium DIHAPUS**.
    Email pakai `mailto:`.
  - `hero.line1/2/3` = `AURA / AUVAROSE / ""` (saat ini tidak dirender — judul besar di
    Hero tetap hardcoded `FULLSTACK DEVELOPER` & `SOFTWARE ENGINEER`).
  - About, experience, education (IT Academy), tech stack, howIWork — sudah milik Aura.
- **Seed demo** di `src/lib/data.ts` + `supabase/schema.sql`:
  - Proyek: `Portfolio Dashboard` (Next.js/React/Supabase/Tailwind) &
    `Retro Game Arcade Hub` (React/JS/LocalStorage).
  - Sertifikat: `Frontend Web Developer Specialist` (IT Certification Board) &
    `Database Engineering & Systems Administrator` (Linux Professional Institute).
- **Metadata** (`src/app/layout.tsx`): title `Aura Auvarose — Full Stack Developer`.
- **Marquee** (`HomeClient.tsx`): `AURA AUVAROSE`, `FULLSTACK DEVELOPER`, `SOFTWARE ENGINEER`.
- **Sidebar sosial** (`Sidebars.tsx`): Github / Instagram / Email / Discord / TikTok —
  icon Email, Discord, TikTok baru; `LinkedinIcon` dihapus.
- **Nav logo**: tetap huruf `A` (cocok untuk Aura).
- **CV**: `public/cv.pdf` (dari `auraauvarose.pdf`) — tombol "Download CV" (`profile.cvUrl`) berfungsi.

> Jangan re-introduce nama/URL Apriyanto; jangan kembalikan LinkedIn/Medium tanpa
> tanya user dulu.

---

## 5. Deploy — Vercel + Supabase + Cloudflare R2 (FINAL)

Stack produk: **Vercel** (hosting) + **Supabase** (Postgres + auth admin) +
**Cloudflare R2** (storage presigned). Credentials hidup di `.env.local` (gitignored,
JANGAN di-commit); nilai sama juga di-set di **Vercel Environment Variables**.

**Env vars (7):**
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `R2_ACCOUNT_ID`,
`R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` (= `portofoliov2`),
`NEXT_PUBLIC_R2_PUBLIC_URL` (= `https://pub-78371aed3dec4d5982ef760f28edc303.r2.dev`).

**Supabase:** tabel `projects`, `certifications`, `gallery_photos` + RLS + seed dibuat
dengan menjalankan `supabase/schema.sql` di SQL Editor. Admin login `/admin`; matikan
sign-up publik (hanya akun admin). (Status saat catatan ini: tabel belum dijalankan user.)

**GitHub:** repo `auraauvarose/portofolioV2`, branch `master`.
Vercel tersambung ke repo → **push = auto-deploy**. Token GitHub tidak boleh tersimpan
di `git remote` (bersihkan setelah push).

---

## 6. Discord — verifikasi domain (FINAL)

Diskord "Connect your Domain" diverifikasi lewat file statis:

- File: `public/.well-known/discord`, isi persis `dh=92b9c5ccabc1b5678196b68d87091c4cf27c6d8f`
  (tanpa newline akhir).
- Online di `https://auraauvarosee.vercel.app/.well-known/discord`.
- Jangan hapus atau ubah isi file ini tanpa user setuju (bikin verifikasi Discord gagal).

---

## Aturan umum

- Sesudah edit apa pun, wajib `pnpm build` / `npx next build` + `npx tsc --noEmit`
  — harus 0 error sebelum diklaim selesai.
- Jangan re-introduce `CustomCursor`, jangan ubah rumus transform lensa, jangan
  pindahkan handler `mouseenter/leave` dari container teks ke section.
