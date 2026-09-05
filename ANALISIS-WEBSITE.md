# 🔍 Analisis Lengkap Website — Portofolio Aura Auvarose

> Hasil analisa 3 agent paralel (Tech Stack · Effects Mapper · Design System), diverifikasi langsung dari source code.
> Urutan section diverifikasi dari `src/components/HomeClient.tsx`.

---

# BAGIAN 1 — TEKNOLOGI YANG DIPAKAI

## 1.1 Framework & Runtime

| Teknologi | Versi terpasang | Catatan |
|---|---|---|
| **Next.js** | 15.5.23 | App Router (`src/app/`), Server Component + `"use client"` |
| **React / React DOM** | 19.2.8 | `page.tsx` async Server Component, `dynamic = "force-dynamic"` |
| **TypeScript** | 5.9.3 | `strict: true`, path alias `@/* → ./src/*` |
| **pnpm** + **Node 22** | — | CI GitHub Actions pakai Node 22 |

- `next.config.ts`: `images.unoptimized: true` (optimizer Next dimatikan — kebutuhan Cloudflare Workers), eslint diabaikan saat build.

## 1.2 Styling & Animasi

- **Tailwind CSS v4 (4.3.3)** — konfigurasi CSS-first via `@tailwindcss/postcss`, **tanpa** `tailwind.config.js`. Seluruh tema di `src/app/globals.css`: blok `@theme` berisi palet kustom (`--color-accent: #eb5939`, `--color-ink`, `--color-panel`, `--color-ecru`, `--color-khaki`) + animasi kustom `--animate-*` (marquee, pulse-dot, color-cycle, hero-float, dll.) dengan `@keyframes` inline.
- **motion 13.1.0** (penerus Framer Motion) — diimpor `"motion/react"` di `Education.tsx` dan `ScrollWordReveal.tsx` (`useScroll`, `useSpring`, `useTransform`).
- **8 font Fontshare self-hosted** via `next/font/local` (16 file woff2 di `public/fonts/`, di-download otomatis oleh `scripts/download-fonts.sh`): Switzer, Cabinet Grotesk, Tanker, Bevellier, Comico, Chillax, Zodiak (italic), Array.
- Tema **dark default + toggle light** (script anti-FOUC baca `localStorage` sebelum paint) + **bilingual EN/ID** via `LanguageProvider` (Context + localStorage).

## 1.3 Backend & Data — Supabase

- **`@supabase/ssr`** — browser client (`createBrowserClient`) + server client (`createServerClient` + `cookies()`), dipakai read publik di `src/lib/data.ts`.
- **`@supabase/supabase-js`** — admin client dengan `SUPABASE_SERVICE_ROLE_KEY` untuk semua route tulis (POST/PUT/DELETE).
- **Tabel** (`supabase/schema.sql`): `projects`, `certifications`, `gallery_photos` — semua bilingual (EN/ID), RLS aktif (public read, write via service_role).
- **Auth admin = password-only custom** (bukan Supabase Auth): middleware `src/middleware.ts` gate `/admin/*` + API tulis via cookie `admin_session` (hash dari secret+password), perbandingan konstan-panjang, cookie httpOnly maxAge 7 hari.
- **Fallback data demo hardcoded** bila env Supabase tidak diset.

## 1.4 Storage — Cloudflare R2 (presigned upload)

- **`aws4fetch`** — signing SigV4 murni tanpa AWS SDK di `src/lib/r2.ts`.
- Alur **direct-to-browser upload**: `POST /api/upload/presign` (maks 50 MB) → server menandatangani presigned PUT URL (1 jam) → browser `PUT` langsung ke R2 → `publicUrl` disimpan ke Supabase. Delete object juga via signed request.

## 1.5 Deployment — Cloudflare Workers via OpenNext

- **`@opennextjs/cloudflare`** + **`wrangler` 4**: `main: .open-next/worker.js`, flags `nodejs_compat` + `global_fetch_strictly_public`, binding `ASSETS` + service binding `WORKER_SELF_REFERENCE` (pola internal OpenNext).
- **CI/CD** `.github/workflows/deploy.yml`: push ke main → build (`NEXT_PUBLIC_*` di-inline) → `wrangler deploy` → `wrangler secret bulk` untuk server secrets.

## 1.6 Catatan Menarik ⚠️

1. **`/api/admin/diagnose` tidak dilindungi auth** (di luar matcher middleware) — mengekspos fingerprint `ADMIN_PASSWORD` & status env. **Saran: hapus atau lindungi endpoint ini.**
2. **Default password hardcoded `"aura2007"`** di `src/lib/config.ts` sebagai fallback.
3. `.well-known/discord` — payload verifikasi domain Discord (hubungkan situs ke profil Discord).
4. Musik self-hosted `public/Taylor Swift - Style.mp3` — ada implikasi lisensi musik komersial.
5. Hanya **7 dependencies runtime** — sangat lean, tanpa UI library / state management eksternal / test framework.

---

# BAGIAN 2 — PETA EFEK, URUT DARI ATAS SAMPAI BAWAH

**Urutan halaman:** Loading Curtain → (overlay global) → Nav → Hero → Marquee → About → WhatIDo → Education → Marquee (reverse) → Certifications → TechStack → Marquee → Showcase → Contact → Footer

## 2.1 Loading Curtain — "Greeting Cycle + Curtain Drop"
Sapaan multibahasa (Hello/Hola/Ciao/こんにちは/Hallo) ganti tiap 320ms; tiap kata di-remount via `key={...}` agar animasi `preloader-word` (opacity+translateY+rotate+blur, 0.42s) ter-trigger ulang. Progress bar `width %`. Setelah ±2.1s tirai turun `translateY(100%)` 700ms `cubic-bezier(0.76,0,0.24,1)`, unmount via `onTransitionEnd` (bukan timer).

## 2.2 Nav — "Roll-Up Link Hover" + Hamburger Morph
Dua label ditumpuk dalam `overflow-hidden`; hover menggeser stack −50% sehingga label accent menggantikan label muted (500ms). Hamburger 3 garis → X (rotate ±45° + fade tengah). Menu mobile fullscreen: fade + item staggered `menu-item-in` (delay i×70ms).

## 2.3 Hero — "Cursor-Following Lens Reveal" ⭐ (efek ikonik)
- **Bukan clip-path, bukan mask** — trik **overflow-hidden + counter-transform**: `onMouseMove` menulis CSS var `--mx/--my`; disc oranye 280px mengikuti kursor via `translate(calc(var(--mx) − 140px), ...)`. Di dalam disc ada layer 100vw×100vh berisi headline hitam "SOFTWARE ENGINEER" yang **di-counter-translate** — teks "terkunci ke layar" sementara jendela lingkaran bergerak. Di luar lens: "FULLSTACK DEVELOPER" putih/khaki.
- Pop in/out lens: `scale-0 → scale-100` spring-back `cubic-bezier(0.34,1.56,0.64,1)`.
- **Sticky hero + curtain parallax**: hero pinned `sticky top-0 h-screen`, konten berikutnya `z-[1] rounded-t-[2rem]` + shadow + `clip-path: inset(-130px 0 0 0)` — lembar konten "naik menutupi" hero.
- **Scroll dim**: rAF-throttled menulis var `--hero-dim` langsung ke DOM (tanpa setState); overlay menggelap seiring scroll.
- **Tilt3D karakter**: `rotateX/rotateY/scale` via CSS var + `perspective: 1000px` + `preserve-3d`; auto-mati di perangkat sentuh.
- **Idle float** (`hero-float` 5s infinite), **cross-fade tema** 700ms, **glow orbs** accent blur.

## 2.4 Marquee ×3 — "Infinite Marquee + Velocity Skew"
Track 8 salinan teks, `translateX(0 → -50%)` 30s linear infinite (loop mulus karena duplikasi 50%), tepi fade via CSS mask. **Skew mengikuti kecepatan scroll**: rAF loop (di-gate IntersectionObserver) ukur delta scrollY → target skew clamp ±7° → lerp 0.1 → `skewX()`. Label: "AURA AUVAROSE" → "FULLSTACK DEVELOPER" (reverse) → "SOFTWARE ENGINEER".

## 2.5 About — "Scroll-Scrubbed Word Reveal"
`ScrollWordReveal` (motion/react): `useScroll` + `useSpring` (stiffness 140, damping 26) → per kata: opacity 0.4→1, y 12→0, **blur 6px→0**. Ini **scrubbing** — maju/mundur mengikuti scroll. Kata highlight diberi warna oranye. CTA: underline tumbuh `w-0 → w-full` saat hover.

## 2.6 WhatIDo — "Hover Orange Fill-Up Row"
Kata judul "menyala" saat discroll (baseOpacity 0.3 → warna oranye). Hover/tap: panel oranye `scaleY 0→1 origin-bottom` — **wipe naik dari bawah** (500ms), teks berubah hitam; deskripsi slide-in dari kanan.

## 2.7 Education — "Sticky Rail + Progress Line + 3D Flip-Up Cards"
Kolom kiri sticky; garis progres vertikal accent `scaleY 0→1` di-drive scroll + spring. Tiap kartu scrub 3D: opacity 0→1, y 64→0, **rotateX 8°→0** (perspective 1000), scale 0.95→1 — kartu "flip-up" saat masuk viewport, bisa mundur. Hover kartu membanjir `bg-accent`.

## 2.8 Certifications — "Masked Heading + Tilt Cards + Carousel + Modal"
- **Heading masked word reveal**: tiap kata dibungkus mask `overflow:hidden`, naik dari `translateY(125%)` 950ms, stagger 70ms; garis hairline `scaleX 0→1`; **direction-aware + replay tiap pass** (IntersectionObserver 0.35).
- Kartu: Tilt3D + gambar un-zoom `scale(1.14) → 1` saat masuk viewport (`Reveal media`).
- Carousel paging: slide masuk **arah-aware** (kiri/kanan sesuai tombol), dot aktif memanjang. Modal via portal + scroll-lock + Escape.

## 2.9 TechStack — "Interactive 3D Mind Map" ⭐ (paling kompleks)
Node radial dalam world 1200×1200 dihubungkan SVG path lengkung:
- **Pop-in staggered** (scale 0.4→1, delay i×120ms / +j×45ms)
- **Line drawing**: `stroke-dashoffset 1→0` — garis "tergambar" dari pusat
- **Pan / pinch-zoom / wheel-zoom** dengan zoom-to-cursor, semua via refs + satu rAF-scheduled transform (anti-jank mobile), background dot-grid parallax −0.15×
- **Mouse tilt parallax** rotateX/rotateY 3° (perspective 1400px)
- **Hover dim**: cabang lain diredupkan opacity 0.35; tooltip fade; center glow berdenyut + ring dashed berputar 18s

## 2.10–2.12 Showcase — Projects & Gallery
- Tab Work/Gallery berbentuk **parallelogram skew** (`-skew-x-6` + counter-skew teks).
- Projects: pola sama dengan Certifications (Reveal media, Tilt3D, carousel arah-aware, modal, filter pills).
- Gallery: hover caption gradient fade dari bawah; **Lightbox** portal fullscreen + Escape + scroll-lock + tombol **Fullscreen API + lock landscape** di mobile.

## 2.13 Contact — "Color-Cycling Badge + Roll-Over Socials"
- Badge "Available" + dot **siklus warna sinkron 8s** (hijau→sky→violet→oranye) + radar ping (`ping-soft` scale 2 + fade).
- Social links: teks **bergulir ke atas** — label atas keluar −110%, label bawah (serif italic accent) masuk dari bawah.
- Jam lokal Asia/Jakarta update tiap detik (pause saat tab hidden). Headline raksasa, baris kedua `.text-outline`.

## 2.14 Footer — "Gradient Hue-Cycling Watermark"
Watermark "AURA" (font Array, 30vw) dengan `background-clip: text` berisi gradient 4 warna; animasi `mark-hue` 10s geser background-position + **hue-rotate 0→25°** — gradient mengalir melalui huruf. Varian mobile: hanya `filter: hue-rotate` (GPU). Dipause saat offscreen (IntersectionObserver).

## 2.15 EFEK GLOBAL / OVERLAY (selalu aktif)

1. **Custom Cursor** — dot instan + ring trailing **lerp 0.16** (elastic), `mix-blend-difference`, membesar 3.5rem + border accent di elemen interaktif; hanya di `(hover:hover) and (pointer:fine)`.
2. **Spider Walker** — laba-laba FSM rAF: jalan keliling perimeter viewport (40–60 px/s) → idle → (45% chance) turun benang 90px/s → naik; kaki CSS keyframes ±14°; rAF dipause saat idle; hormati reduced-motion.
3. **TV Static / Film Grain** — tekstur noise **SVG feTurbulence** data-URI, `mix-blend-mode: overlay`, jiter `steps(8)` per 0.5s + scanline CRT `scan-jump` 0.09s.
4. **Scroll Hint** — teks "SCROLL" vertikal + panah bob; panah rotate 180° di dasar halaman; fade-out di tengah halaman.
5. **Music Player** — singleton `HTMLAudioElement` (pub-sub), ikon play ↔ equalizer 3 bar (`eq-bounce` delay 0/160/320ms).
6. **Theme Toggle "Blinds"** — dua panel ink 50.5% layar via **Web Animations API** (translateY ∓101%, 550ms); swap `.dark` di frame berikutnya "di balik panel".
7. **Smooth scroll** global + scrollbar disembunyikan.
8. **Sistem `Reveal` generik** — lift + settle **dengan overshoot** (y 46px + scale 0.965 + rotate 0.75°, easing `cubic-bezier(0.22,1.15,0.32,1)`), direction-aware, replay tiap pass, delay untuk stagger.
9. **`prefers-reduced-motion`** dihormati menyeluruh.
10. **Pola performa**: scroll listener rAF-throttled menulis CSS var langsung (bukan setState); loop rAF di-gate IntersectionObserver; tanpa `will-change` permanen; 3D di-flatten di touch.

> 📝 **Catatan**: `LetterReveal.tsx` (reveal per-huruf, stagger 28ms) ada di codebase tapi **belum dipakai** section mana pun.

---

# BAGIAN 3 — DESIGN SYSTEM VISUAL

## 3.1 Palet Warna (dark default)

| Token | Nilai | Peran |
|---|---|---|
| `--color-accent` | `#eb5939` | Terracotta — index, hover, tombol aktif, selection, glow |
| `--color-accent-soft` | `#d5542f` | Varian aksen lebih tua |
| `--color-ink` | `#0d0e13` | Kanvas utama (hampir hitam kebiruan) |
| `--color-panel` | `#13151c` | Surface kartu/modal |
| `--color-ecru` | `#d6d0c4` | Teks body — krem hangat (bukan putih murni) |
| `--color-khaki` | `#b7ab98` | Krem gelap sekunder |
| `--color-fg` / `--color-muted` | `#ffffff` / `#9ca3af` | Foreground / teks redup |

- **Light mode**: token di-flip (`#f4f4f5` / `#ffffff` / `#2f2f2f`...) + komponen yang hardcode warna dark diflip via selektor `:root:not(.dark) ...`.
- **Siklus status** 8s: `#22c55e` → `#38bdf8` → `#a78bfa` → `#eb5939`.
- Highlight oranye `#ff7a50` (dark, kontras ~7:1). Hairline dominan `border-white/10`. `::selection` = accent + teks hitam.
- Watermark footer: gradient bergerak accent→sky→violet diklip ke teks.

## 3.2 Tipografi

| Font | Peran |
|---|---|
| **Switzer** (400–700) | Body default |
| **Tanker** | H1 hero (`clamp(3.4rem, 16vw, 11.5rem)`) |
| **Cabinet Grotesk** (400–900) | Judul display |
| **Bevellier** (600/700) | Judul section |
| **Comico** | Marquee besar |
| **Chillax** (600) | Bio About |
| **Zodiak** (700 italic) | Aksen serif italic (hover social) |
| **Array** (600) | Watermark "AURA" 30vw di Footer |

Pola konsisten: **micro-label UPPERCASE ter-tracking** (`tracking-widest`–`[0.4em]`), judul display raksasa uppercase, **teks outline** (`-webkit-text-stroke` 1px + fill transparan) untuk baris kedua & fallback judul.

## 3.3 Layout & Struktur

- **"HUD" bingkai layar**: nav fixed atas (z-100), sidebar rail kaca kiri (sosial) & kanan (musik/EN-ID/tema), scroll hint, grain overlay z-90, laba-laba — semua fixed.
- Section: `px-6 md:px-10 py-16 md:py-32`, container `max-w-7xl`.
- Hero pinned + sheet konten `rounded-t-[2rem]` menimpa dengan shadow besar.
- Ritme kicker: nomor `font-display text-accent` + label uppercase + garis hairline flex-1.
- Marquee sebagai pemisah antar grup section.

## 3.4 Bahasa Visual Komponen

- **Kartu**: `rounded-2xl border-white/10 bg-panel` + shadow lembut; hover border→accent + gambar `scale-105` 700ms.
- **Radius**: `rounded-full` dominan (46×) > `rounded-2xl` (12×) — hampir tanpa sudut tajam.
- **Glassmorphism**: `.glass` = putih 3% + border 8% + `backdrop-blur(12px)`.
- **Hover khas**: roll teks dua lapis, underline tumbuh, orange fill-up `scale-y`, flood `bg-accent` (Education).
- **Glow oranye** `rgba(235,89,57,…)` untuk elemen "hidup" (disk hero, node TechStack, dot kategori).
- **Tekstur**: grain feTurbulence + scanline CRT, dot-grid + ring dashed berputar di TechStack.
- **Kursor kustom**: dot accent + ring blend-difference.

## 3.5 Karakter Desain

**Dark editorial-playful dengan sentuhan indie/CRT.** Kanvas hampir hitam + teks krem hangat dipertajam satu aksen terracotta yang dipakai disiplin. Tipografi memadukan display condensed raksasa dengan micro-label ter-tracking. Kerangka HUD + kursor kustom + grain TV-statik + marquee skew + laba-laba easter egg membuat halaman terasa seperti **"ruang pamer interaktif" yang hidup** — bukan halaman statis.

---

*Dibuat otomatis dari analisa source code — 3 subagent paralel · Next.js 15.5.23 · React 19.2.8 · Tailwind 4.3.3 · motion 13.1.0*
