# Catatan perbaruan

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

## 2. Custom Cursor — KEPUTUSAN: pakai cursor native (FINAL)

- Keputusan user: mau pakai **kursor mouse biasa (native)**, bukan dot+ring custom.
- `src/components/CustomCursor.tsx` **tidak dipakai/dirender** di produksi — jangan
  dibuat ulang. (Catatan: komponen `CustomCursor.tsx` sempat masih ada & di-render
  oleh `HomeClient.tsx` dari sesi sebelumnya; jika berurusan dengan file itu,
  pastikan tidak menambah `cursor: none` di `body` dan tidak memperlihatkan
  dot+ring custom.)
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

Stack produk: **Vercel** (hosting) + **Supabase** (Postgres) + **Cloudflare R2**
(storage presigned). Credentials hidup di `.env.local` (gitignored, JANGAN di-commit);
nilai sama juga di-set di **Vercel Environment Variables**.

**Env vars (10):**
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` (server-side, buat tulis data lewat API — JANGAN bocor
ke browser), `ADMIN_PASSWORD` (= `aura2007`), `ADMIN_COOKIE_SECRET` (opsional),
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
(= `portofoliov2`), `NEXT_PUBLIC_R2_PUBLIC_URL`
(= `https://pub-78371aed3dec4d5982ef760f28edc303.r2.dev`).

**Admin login = password-only** (bukan lagi email/password Supabase):
- `/admin/login` cuma satu kolom password; benar → set cookie `admin_session`
  (httpOnly), salah → 401.
- Middleware melindungi `/admin/*` + API tulis (`/api/projects`, `/api/certifications`,
  `/api/gallery`, `/api/upload`) pakai cookie tsb.
- Semua tulis/hapus data admin lewat **API route** yang dilindungi cookie, memakai
  `SUPABASE_SERVICE_ROLE_KEY` (bypass RLS). Publik tetap bisa **membaca** via RLS
  `for select using (true)`.
- Tidak ada tombol admin di website — akses cuma via URL `/admin`.

**Supabase:** tabel `projects`, `certifications`, `gallery_photos` + RLS + seed dibuat
dengan menjalankan `supabase/schema.sql` di SQL Editor. (Status saat catatan ini:
tabel perlu dijalankan user.)

> **PENTING — R2 CORS:** upload browser akan gagal `Failed to fetch` kalau bucket R2
> belum punya CORS policy. Tambahkan di Cloudflare R2 → bucket → Settings → CORS
> Policy (Allows `PUT`, header `Content-Type`). Detail + JSON ada di `README.md` §2.
> Ini dari sisi Cloudflare, TIDAK bisa diperbaiki dari kode.

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

## 7. Admin upload — batas 50 MB + dukung PDF (FINAL)

- Semua upload di admin (Projects, Certifications, Gallery) punya **limit 50 MB**
  (`MAX_UPLOAD_BYTES` di `src/lib/config.ts` = `50 * 1024 * 1024`).
  - Dicek di sisi client (`ImageUpload.tsx`) dan diverifikasi lagi di server
    (`/api/upload/presign`, balas `413` kalau lebih).
- Kolom upload menerima **gambar + PDF** (`accept="image/*,.pdf,application/pdf"`).
  - Preview PDF = ikon file yang bisa diklik (bukan `<img>` yang rusak).
  - `src/components/admin/FileThumb.tsx` = thumbnail kecil untuk daftar item
    (otomatis tampil ikon PDF bila filenya PDF).
- Folder upload R2: `projects/`, `certifications/`, `gallery/`.
- ⚠️ Upload browser butuh **CORS bucket R2** dikonfigurasi (lihat §5 & README),
  kalau tidak → error `Failed to fetch`.

---

## 8. Halaman loading `/loading` — hanya kunjungan pertama + animasi curtain (FINAL)

- Pengganti overlay `Preloader.tsx` lama (yang nahan website ~9 detik — DIHAPUS).
- **Load hanya di kunjungan pertama** per browser: flag disimpan di `localStorage`
  (key `pf-loaded-v2`, helper `src/lib/loading.ts`). Kunjungan berikutnya langsung
  ke home tanpa loading.
- **Halaman terpisah** `src/app/loading/page.tsx`:
  - Alur: buka `/` → `HomeClient` arahkan ke `/loading` (hanya kalau belum pernah
    loading) → curtain **naik** (terbuka) → animasi greeting → curtain **turun**
    (menutup) → balik ke home.
  - **Curtain** = panel penuh layar, `translateY(100%) → 0 → 100%` (naik saat muncul,
    turun saat selesai), ~700ms.
- `HomeClient.tsx` menampilkan layar ink singkat saat memutuskan arah, supaya tidak
  ada flash konten.
- Jangan kembalikan overlay `Preloader` yang memblokir lama.

---

## 9. Mobile / interaktivitas (FINAL)

- **Menu hamburger mobile** muncul dengan animasi masuk berurutan (staggered) untuk
  tiap item + fade-in konten (`menu-item-in` / `menu-fade-in` di `globals.css`).
- **Hover berfungsi saat tap** di layar sentuh: efek `active:`/`touch-active` ditambah
  supaya elemen interaktif tetap beranimasi saat diketuk.
- **Kartu Tilt3D** kini menanggapi `pointerdown` (tap) — jadi kartu proyek/gallery
  ikut tilt saat disentuh di mobile (bukan cuma mouse-move). Reveal scroll sudah
  berfungsi di mobile.
- **Sosmed menu mobile = ikon logo** (bukan teks): ikon bersama di
  `src/components/social-icons.tsx` (Github, Instagram, Email, Discord, TikTok,
  LinkedIn), dipakai juga oleh `Sidebars.tsx` (hapus duplikasi).
- **Hapus blob orange** di dasar halaman (`Contact.tsx`): circle `bg-accent/10 blur`
  yang dulu ada di paling bawah **dihapus** atas permintaan user.

---

## Aturan umum

- Sesudah edit apa pun, wajib `pnpm build` / `npx next build` + `npx tsc --noEmit`
  — harus 0 error sebelum diklaim selesai.
- Jangan pakai/render cursor custom (pakai cursor native, lihat §2); jangan ubah
  rumus transform lensa; jangan pindahkan handler `mouseenter/leave` dari container
  teks ke section.
