# Audit Gabungan — portofolioV2
*Dihasilkan dari 2 agent paralel (security audit + code-quality/bug audit), dengan verifikasi silang manual terhadap sumber dan artefak build. Tidak ada file yang dimodifikasi saat audit.*

> **STATUS P0 — SELESAI & TERVERIFIKASI (build + smoke test runtime):**
> S1 ✅ (route diagnose dihapus, 404) · S2 ✅ (fallback dihapus; `aura2007` = 0 kemunculan di chunk klien baru) · S3 ✅ (token = `exp.HMAC-SHA256`, expiry 7 hari, `secure` dari protokol request; cookie lama format hash → 401) · S5 ✅ untuk setup baru (`schema.sql`) — **aksi manual masih diperlukan di DB live + matikan signup** · S6 ⚠️ (README diberi peringatan; rotasi secret + deploy CI = aksi user) · S9-S15 sebagian → P1/P2.
> Bug B-tier, rate-limit login (S4), presign allowlist (S7), dsb. **belum** — lihat §5.
> Aksi user yang tersisa ada di bagian **"Setelah deploy"** di bawah.


**Stack:** Next.js 15 App Router · React 19 · Tailwind v4 · Supabase (Postgres+RLS) · Cloudflare R2 (presigned) · deploy Workers via @opennextjs/cloudflare. Repo GitHub **public**.

Legenda: 🔴 Kritis · 🟠 Tinggi · 🟡 Sedang · ⚪ Rendah/Ringan

---

## 1. Kerentanan Keamanan (urut severity)

| # | Sev | Temuan | Lokasi |
|---|-----|--------|--------|
| S1 | 🔴 | `/api/admin/diagnose` tanpa auth; membocorkan `activePasswordFingerprint` yang memakai **fungsi hash yang sama** dengan pembuat cookie sesi → siapa pun set `admin_session=admin-<fp>` = **admin penuh**, exfil email via `?scope=admin`, deface konten. (middleware tidak meng-cover `/api/admin/*`) | `src/app/api/admin/diagnose/route.ts:12-24`, `src/lib/admin-cookie.ts:3-10`, `src/middleware.ts:33-39` |
| S2 | 🔴 | Password default `aura2007` hard-code di source publik + README; fallback aktif diam-diam bila env lupa diset. **Terverifikasi ikut ter-bundle ke chunk klien publik** (`page-*.js`, `admin/page-*.js`) karena 15 komponen klien mengimpor `config.ts` | `src/lib/config.ts:3-5`, `README.md:52,123` |
| S3 | 🟠 | Cookie sesi = hash 32-bit statis, tanpa expiry/nonce/HMAC → derivable offline, tak bisa dicabut (logout cuma hapus lokal), semua sesi identik; `secure` flag tergantung `NODE_ENV` yang tak terjamin di Workers | `src/lib/admin-cookie.ts`, `src/lib/admin-auth.ts:22-43` |
| S4 | 🟠 | `/api/admin/login` tanpa rate-limit/lockout → brute-force tak terbatas | `src/app/api/admin/login/route.ts:4-22` |
| S5 | 🟠 | RLS `for all to authenticated using(true)` padahal app tak memakai Supabase Auth → orang yang **self-signup via GoTrue** (default aktif) dapat tulis/hapus semua tabel + baca email komentar (revoke hanya untuk `anon`) | `supabase/schema.sql:71-76`, `supabase/comments.sql:27-28,47-48` |
| S6 | 🟡 | Build lokal `cf:build` meng-bake SEMUA env (termasuk service_role & secret R2) ke `.open-next/cloudflare/next-env.mjs` yang ikut ter-deploy — **terverifikasi ada di artefak saat ini** | `@opennextjs/cloudflare` compile-env; README menganjurkan build dari laptop |
| S7 | 🟡 | Presign upload: cap 50MB hanya `if typeof size === "number"` (omit lolos), tak ada allowlist content-type (HTML/SVG bisa di-host di domain publik R2), `folder` tanpa allowlist → `new URL()` normalisasi `../` bisa berpindah **bucket** | `src/app/api/upload/presign/route.ts:21-28`, `src/lib/r2.ts:36-41` |
| S8 | 🟡 | Guestbook auto-`approved:true`; rate-limit in-memory per-isolate (nihil di Workers) + kunci IP dari `x-forwarded-for` yang bisa dipalsukan (padahal `request.cf.clientIp` tersedia) | `src/app/api/comments/route.ts:13,107-127` |
| S9 | 🟡 | Nol security headers (tanpa CSP, X-Frame-Options → `/admin` clickjackable, nosniff, HSTS); tak ada `robots.txt` larang indexing `/admin` | `next.config.ts`, repo |
| S10 | 🟡 | Error internal (`err.message` Supabase/PG, pesan setup) dikembalikan mentah ke klien | `src/lib/supabase/admin.ts:13-15,25-28`, semua 400 |
| S11 | ⚪ | CSRF satu lapis (SameSite=Lax saja, tanpa Origin check) | `admin-auth.ts:33` |
| S12 | ⚪ | CORS R2 `AllowedOrigins:["*"]` + PUT di README/script | `README.md:171-184` |
| S13 | ⚪ | Matcher middleware menyebut API routes tapi body tak menegakkan apa pun → ilusi defense-in-depth (inilah temuan yang benar; bukan "redirect API" — sudah dikoreksi, lihat §4) | `src/middleware.ts:9-39` |
| S14 | ⚪ | Open redirect pasca-login: `router.push(searchParams.get("next"))` tak divalidasi | `src/app/admin/login/page.tsx:34-35` |
| S15 | ⚪ | CI: actions tak SHA-pinned, API token long-lived (bukan OIDC), secrets sempat tertulis `/tmp/secrets.json`, tanpa `environment:` protection | `.github/workflows/deploy.yml` |

**Yang sudah benar:** `.env.local`/`.dev.vars` tak pernah ter-commit (history bersih); service_role tak pernah di-import file `"use client"`; semua mutation route utama panggil `requireUser()`; render komentar pakai text-node (tanpa stored XSS); `verifyAdminPassword` constant-time-ish; filename presign disanitasi; CI `--frozen-lockfile` + permissions minimal.

## 2. Bug & Kualitas Kode (paling berdampak)

| # | Sev | Temuan | Lokasi |
|---|-----|--------|--------|
| B1 | 🟠 | `save()`/`delete()` manager admin tanpa `try/catch` → fetch reject = tombol "Saving…" macet permanen; **kegagalan delete 100% senyap** (`if (res.ok)` tanpa else) | `ProjectsManager.tsx:97-128`, `CertificationsManager.tsx:90-121`, `GalleryManager.tsx:86-117` |
| B2 | 🟠 | Data demo menutupi DB kosong/error → proyek "Portfolio Dashboard" palsu muncul saat admin hapus item terakhir | `src/lib/data.ts:89-94,114` |
| B3 | 🟡 | Semua halaman `force-dynamic`, nol revalidate → 3-4 query Supabase per pageview; `/komentar` menembak data dobel (server + client fetch) | `page.tsx:4`, `komentar/page.tsx:5,14` + `CommentsClient.tsx:157` |
| B4 | 🟡 | `sort_order` default 0 → entri baru selalu menyalip kurasi; urutan admin ≠ publik (tiebreaker beda) | `ProjectsManager.tsx:20`, `api/projects/route.ts:24`, `data.ts:87-88` |
| B5 | 🟡 | `<html lang="en">` statis — bahasa ID tak pernah dilaporkan ke SEO/screen reader | `layout.tsx:95`, `providers.tsx:67-78` |
| B6 | 🟡 | `toggleTheme` baca DOM bukan state → dobel-klik 1 frame jadi no-op; timer pembersih tak di-clear | `providers.tsx:80-139` |
| B7 | 🟡 | PUT `[id]` pakai `??` per kolom → payload parsial menimpa kolom lain diam-diam; `.single()` pada id tak dikenal = 400 bocor pesan PG, bukan 404; tanpa validasi UUID | `api/projects/[id]/route.ts:19-33` (+padanan) |
| B8 | 🟡 | Section TechStack **hilang total** di tablet landscape (JS `(pointer:coarse)` ≥768px vs CSS `md:hidden`); cabang desktop/mobile post-hydration (flash) | `TechStack.tsx:920-923,861` |
| B9 | 🟡 | Kartu `onClick` pada `<article>` tanpa `role/tabIndex` (Proyek & Sertifikat) — keyboard terblokir padahal README janji navigasi keyboard | `Projects.tsx:63-66`, `Certifications.tsx:51-54` |
| B10 | 🟡 | `deleteR2Object` tak pernah dipanggil → objek R2 yatim selamanya saat hapus/ganti gambar | `src/lib/r2.ts:64-76` |
| B11 | 🟡 | Homepage diblokir ~2,1s oleh timer preloader (LCP); preloader timer di-restart oleh scroll saat tirai tampil (inline `onDone`) | `HomeClient.tsx:25-27,143,154,35-52` |
| B12 | 🟡 | `images.unoptimized:true` + nol `next/image` → gambar 50MB disajikan utuh ke kartu 400px; ±5,9MB aset mati ter-deploy; Hero selalu download 4 gambar; 16 font preload per halaman | `next.config.ts:4-6`, `public/*`, `Hero.tsx:124-161`, `layout.tsx:6-74` |
| B13 | 🟡 | `pnpm lint` mati total (tanpa eslint config/deps, `ignoreDuringBuilds`); dua lockfile tracked (dev pakai npm, CI pakai pnpm); `pnpm-workspace.yaml` key `allowBuilds:` tidak valid; `check-r2-cors.mjs` impor `@aws-sdk/client-s3` non-dep; `download-fonts.sh` tak punya family `Array` → setup baru gagal build | `package.json:8`, `pnpm-workspace.yaml:1`, `scripts/*` |
| B14 | ⚪ | Deskripsi ID tak tampil bila EN kosong (gerbang render salah); badge "Professional Work" salah pakai `featured`; marquee separator kosong; context `providers` tanpa `useMemo` (re-render seluruh pohon); `body.style.overflow` diperebutkan 4 komponen; Nav mobile focusable saat tertutup; 15 fetch tanpa AbortController; dead code (`LetterReveal.tsx`, refs TechStack) | tersebar — detail di laporan agent |

## 3. Rantai Eksploit Utama (bukti lengkap)
1. `GET /api/admin/diagnose` → 200, baca `activePasswordFingerprint` + `cookieSecretSet:false`.
2. Set cookie `admin_session=admin-<fp>` → lolos `isAdmin()` dan middleware.
3. `/admin` full access: deface projects/gallery/certs, presign-upload HTML/SVG ke domain publik R2, `GET /api/comments?scope=admin` → **exfil semua email pengunjung**.
4. Fallback bila secret ter-set: README kasih password default; login tanpa rate limit; token statis tak bisa dicabut.

## 4. Koreksi Cross-Check
- ❌ *"Middleware me-redirect API tak ber-auth ke `/admin/login` (307, res.ok=true)"* (laporan bug #5) — **tidak benar**: body `middleware.ts:15` hanya match `path.startsWith("/admin")`; `/api/*` lolos dan route mengembalikan 401 JSON. Masalah sebenarnya = matcher S13 (no-op).
- ✅ Verifikasi independen: literal `aura2007` ada di 2 chunk klien ter-build; `next-env.mjs` artefak saat ini berisi kunci `ADMIN_PASSWORD`/`SUPABASE_SERVICE_ROLE_KEY`/`R2_SECRET_ACCESS_KEY` (nilai tidak pernah dikutip).

## 5. Roadmap Perbaikan

**P0 — hari ini (≈30-60 mnt):**
1. Hapus `src/app/api/admin/diagnose/` (atau guard `requireUser()` + buang fingerprint).
2. `config.ts`: buang fallback → fail-fast bila `ADMIN_PASSWORD`/`ADMIN_COOKIE_SECRET` kosong di produksi; pecah file jadi `content.ts` (klien) vs `server-config.ts` (auth); **ganti password** & rotasi `ADMIN_COOKIE_SECRET`.
3. `computeSessionValue` → `crypto.subtle` HMAC-SHA256(secret, "admin-session-v1") atau token acak + allowlist KV; `secure:true` unconditional.
4. Supabase dashboard: **matikan Signup** (atau revoke `for all to authenticated` di schema).
5. `middleware.ts`: tambah guard nyata `/api/admin/*` + mutation `/api/*` → 401 JSON, bukan matcher kosmetik.
6. Deploy ulang dari **CI saja** (build lokal saat ini sudah bake secret → wajib rebuild+redeploy setelah fix, dan anggap nilai secret lama terkompromi bila Worker pernah ter-deploy dari laptop).

**P1 — minggu ini:** login rate-limit (Cloudflare WAF rule paling murah); presign: allowlist folder + size & MIME server-side; `try/catch/finally` + pesan error semua manager admin; `approved:false` default + `cf.clientIp`; security headers + `robots.txt`; normalisasi pesan error; validasi UUID + 404; Origin check.

**P2 — hygiene:** matikan `force-dynamic` → revalidate/tag; satu jalur baca + urutan konsisten; `data.ts` kembalikan `[]`; `sort_order` max+1; optimasi gambar (`next/image` + remotePatterns R2) & hapus 5,9MB aset mati; kurangi font preload; ESLint aktifkan + satu lockfile; `lang` dinamis; a11y kartu (`button`/`role`); `useMemo` context; cleanup listener/AbortController; README: sinkron dengan kode (fitur komentar belum terdokumentasi, klaim "default aura2007" & "max 50MB" & "images unoptimized required" perlu dikoreksi).

---

## Setelah deploy — aksi manual (hanya bisa kamu lakukan)

1. **Supabase SQL Editor** (jalankan SEKARANG pada DB live — `schema.sql` baru hanya melindungi setup baru):
   ```sql
   drop policy if exists "projects_admin_write"       on public.projects;
   drop policy if exists "certifications_admin_write" on public.certifications;
   drop policy if exists "gallery_admin_write"        on public.gallery_photos;
   revoke insert, update, delete, truncate, references, trigger
     on public.projects, public.certifications, public.gallery_photos
     from anon, authenticated;
   ```
2. **Supabase Dashboard → Authentication → Sign Up**: matikan provider signup (dan cek tabel `auth.users` — hapus user tak dikenal yang self-signup).
3. **Rotasi secret** (anggap terkompromi — repo publik + artefak `.open-next` lama kemungkinan sudah ter-deploy dengan secret ter-bake):
   - Password admin baru (panjang & acak) → `wrangler secret put ADMIN_PASSWORD`
   - `wrangler secret put ADMIN_COOKIE_SECRET` (nilai acak baru — sekaligus mencabut semua sesi lama)
   - **Rotasi `SUPABASE_SERVICE_ROLE_KEY`** (Supabase → API keys → roll) dan **R2 API token** (Cloudflare → buat token baru) → `wrangler secret put …`
4. **Deploy lewat CI** (push → GitHub Action) supaya Worker dibangun tanpa `.env.local` laptop. Verifikasi cepat:
   - `curl https://域名/api/admin/diagnose` → 404
   - `curl -X GET https://…/api/projects` tanpa cookie → 401
5. Simpan salinan baru `ADMIN_PASSWORD`; sesi lama semua orang otomatis tidak valid (format token berubah) — login ulang sekali.
