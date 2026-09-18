# Portfolio V2 — Aura Auvarose

A dark, terracotta-accented (**`#eb5939`**) personal portfolio — a full-stack
Next.js app with an admin panel for managing **projects, certifications, and a
photo gallery**. Bilingual **EN / ID** with a language toggle.

| | |
| --- | --- |
| **Frontend** | Next.js 15 (App Router) · React 19 · Tailwind CSS v4 · Motion |
| **Backend** | Next.js API routes · middleware auth |
| **Hosting** | Cloudflare Workers (`@opennextjs/cloudflare`) |
| **Database** | Supabase (PostgreSQL) · RLS + server-side writes |
| **Storage** | Cloudflare R2 (presigned, direct-to-browser uploads) |

---

## Table of Contents


- [Portfolio V2 — Aura Auvarose](#portfolio-v2--aura-auvarose)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Project structure](#project-structure)
  - [Getting started](#getting-started)
  - [Environment variables](#environment-variables)
  - [1. Supabase setup](#1-supabase-setup)
  - [2. Cloudflare R2 setup](#2-cloudflare-r2-setup)
  - [3. Deploy to Cloudflare Workers](#3-deploy-to-cloudflare-workers)
    - [One-time setup](#one-time-setup)
    - [Set server-side secrets](#set-server-side-secrets)
    - [Build + deploy](#build--deploy)
    - [Custom domain](#custom-domain)
    - [Local preview of the deployed Worker](#local-preview-of-the-deployed-worker)
    - [Gotchas](#gotchas)
  - [4. Customizing](#4-customizing)
  - [Scripts](#scripts)

---

## Features

**Public site**

- Hero with cursor-following orange lens reveal, About, What I Do,
  Education, **Experience timeline**, Certifications, Tech Stack,
  Showcase (Projects & Photo Gallery), **Testimonials**, Contact, Footer
- **Contact form** — name, email, subject, budget range, message; validated
  server-side, honeypot + rate-limited, saved to the `contact_messages` table
  and readable in `/admin → Inbox`
- **Case study pages** at `/work/<slug>` — long-form project write-up with tech
  stack, live demo / repo links, and related projects
- **Custom 404 and error pages** (`not-found.tsx`, `error.tsx`)
- Letter-by-letter text reveal, marquee strips, scroll-reveal animations,
  gallery lightbox with keyboard navigation, custom cursor, music player
- Loading curtain on every visit — inline in `HomeClient.tsx`, no separate
  `/loading` route

**SEO**

- Open Graph + Twitter Card metadata with a generated 1200×630 card
  (`public/og.png`, regenerate via `scripts/generate-og.py`)
- `sitemap.xml` (includes every published case study) and `robots.txt`
  (disallows `/admin` and `/api/`)
- JSON-LD: `Person` on the homepage, `CreativeWork` on each case study
- Canonical URLs + `metadataBase`, driven by `NEXT_PUBLIC_SITE_URL`

**Admin panel** (`/admin`, accessed directly by URL — no button on the public
site; password-only login; the password comes from the `ADMIN_PASSWORD`
secret — **no default**, admin login is disabled until it is configured)

- **Inbox** — contact form messages, filterable by status
  (new / read / replied / archived), with one-click email reply
- **Projects** — title (EN+ID), description, case study slug + long-form
  content (EN+ID), tech stack, category, year, live link, repo link, image,
  image alt text, featured
- **Certifications** — title (EN+ID), issuer, category, date, description,
  certificate file, credential verification URL, image alt text
- **Gallery** — photo uploads (title EN+ID, category, image alt text)
- **Comments** — guestbook moderation: new comments arrive **pending** and are
  hidden from the public until approved; toggle visibility without deleting
- **Drag-and-drop ordering** on Projects, Certifications, Gallery, Experience,
  and Testimonials — with up/down buttons so the order is also changeable from
  the keyboard
- **Site** — edit site content (nav, profile, hero, about, what I do, education,
  tech stack) without redeploying; per-section save and reset-to-default
- **Experience** and **Testimonials** — CRUD for the two new public sections
- **Stats** — cookie-less pageview analytics (see below)
- Uploads accept **images and PDFs** → Cloudflare R2 directly from the browser;
  **max file size 50 MB**

**Security**

- Row-level security on all tables — public **read**, server-side **writes only**
  via admin API routes protected by an admin password cookie
- Guestbook comments are **moderated**: `POST /api/comments` stores
  `approved = false`, so nothing appears publicly until an admin approves it
- `contact_messages` has RLS enabled with **no policies at all**, so the inbox
  is unreachable from the browser; only the admin API (service_role) can read it
- `SUPABASE_SERVICE_ROLE_KEY` never touches the browser
- Middleware guards `/admin`, and enforces admin-only methods on
  `/api/contact` (public `POST`, admin `GET`/`PATCH`/`DELETE`)

---

## Project structure

```
portofolioV2/
├── .github/workflows/       # CI/CD (deploy.yml)
├── public/
│   ├── fonts/               # self-hosted fonts (Tanker, Switzer, …)
│   └── …                    # images, cv.pdf, mp3
├── scripts/                 # r2 CORS checker, font downloader, OG generator
├── src/
│   ├── app/
│   │   ├── page.tsx         # public home (server-rendered)
│   │   ├── admin/           # admin panel + login
│   │   ├── api/             # upload presign + CRUD routes
│   │   └── .well-known/     # Discord domain verification
│   ├── components/          # UI sections + admin managers
│   ├── lib/
│   │   ├── supabase/        # client / server / admin clients
│   │   ├── config.ts        # name, about, socials, tech stack (EN + ID)
│   │   ├── data.ts          # seed data
│   │   ├── admin-auth.ts    # admin session + cookie helpers
│   │   └── r2.ts            # R2 presigning (aws4fetch)
│   ├── types/
│   └── middleware.ts        # protects /admin routes
├── supabase/schema.sql      # tables + RLS + seed data
├── .env.example
└── package.json
```

---

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in every value (see below)
npm run dev
```

Open <http://localhost:3000>. Admin panel: <http://localhost:3000/admin>.

> Requires Node 20+ (Node 22+ recommended — `next build` and the test
> runner rely on modern APIs). Uses **npm**; `package-lock.json` is the only
> lockfile.

---

## Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key — server-side writes only |
| `ADMIN_PASSWORD` | Admin panel password — **required** (no default; unset ⇒ admin login disabled) |
| `ADMIN_COOKIE_SECRET` | Strong secret for signing the admin session token (HMAC). Recommended; rotating it revokes all sessions |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | R2 bucket name |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Public base URL for uploaded files |
| `NEXT_PUBLIC_SITE_URL` | Public base URL of the site — used for canonical URLs, Open Graph, sitemap, robots. Must be absolute (`https://…`). Falls back to `src/lib/site.ts` when unset |

`NEXT_PUBLIC_*` vars are inlined at build time. Server-only vars
(`SUPABASE_SERVICE_ROLE_KEY`, `R2_*`, `ADMIN_*`) must also be set as Worker
secrets for production (see [Deploy](#3-deploy-to-cloudflare-workers)).

---

## 1. Supabase setup

1. Create a project at <https://supabase.com>.
2. **SQL Editor → New query** → paste the entire contents of
   [`supabase/schema.sql`](supabase/schema.sql) → **Run**. This creates the
   `projects`, `certifications`, `gallery_photos`, and `contact_messages`
   tables with RLS and seed data. Then run
   [`supabase/comments.sql`](supabase/comments.sql) too (guestbook table —
   required by `/api/comments`).

   **Upgrading an existing database?** Run the stage migrations instead — each
   one is idempotent and adds tables/columns without dropping data:

   | File | Adds |
   | --- | --- |
   | [`supabase/tahap1.sql`](supabase/tahap1.sql) | Case study columns (`slug`, `content_en`, `content_id`, `repo_url`, `alt_text`), certification `credential_url`, gallery `alt_text`, `contact_messages`. Backfills a slug for existing projects. |
   | [`supabase/tahap3.sql`](supabase/tahap3.sql) | `site_content`, `experience`, `testimonials`, `page_views` (plus seed experience rows). |

   The site works before these run — missing tables degrade gracefully
   (site content falls back to `config.ts`, new sections simply don't render,
   analytics shows a "not migrated" hint) — but the admin features that depend
   on them stay inactive until you run the SQL.
3. Copy credentials from **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-side only — never
     expose it to the browser or commit it)

> **Security model:** RLS allows public **reads**; **writes** go through the
> server-side admin API routes via the service_role key (which bypasses RLS —
> there are intentionally no write policies for anon/authenticated, and
> Supabase **self-signup should stay disabled**). Admin session cookies are
> HMAC-SHA256-signed tokens with 7-day expiry, keyed by `ADMIN_COOKIE_SECRET`.
> Set `ADMIN_PASSWORD` to a long random value — there is no default password.

---

## 2. Cloudflare R2 setup

1. Cloudflare dashboard → **R2** → create a bucket (e.g. `portfolio`).
2. Make it publicly readable — preferred: **custom domain**
   (`R2 → bucket → Settings → Custom Domains`, e.g. `cdn.yourdomain.com`). The
   default `*.r2.dev` subdomain works but is rate-limited; not for production.
3. **R2 → Manage R2 API Tokens → Create API token** → grant **Object Read &
   Write** on the bucket. Copy:
   - `Access Key ID` → `R2_ACCESS_KEY_ID`
   - `Secret Access Key` → `R2_SECRET_ACCESS_KEY`
4. **Account ID** (top-right of the dashboard) → `R2_ACCOUNT_ID`.
5. `R2_BUCKET_NAME` → bucket name.
6. `NEXT_PUBLIC_R2_PUBLIC_URL` → public base URL
   (`https://cdn.yourdomain.com` or `https://pub-xxxx.r2.dev`).
7. **Add a CORS policy** (required for browser uploads — without it the admin
   "Upload" fails with `Failed to fetch`):

   ```json
   [
     {
       "AllowedOrigins": ["*"],
       "AllowedMethods": ["GET", "PUT", "HEAD"],
       "AllowedHeaders": ["Content-Type", "*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   > Replace `"*"` with your exact domain in production
   > (e.g. `https://yourdomain.com`). The admin UI also surfaces a clear CORS
   > hint in TypeScript when this is missing.

   To check or apply this from the terminal instead of the dashboard:

   ```bash
   npm run check:cors            # periksa saja
   npm run check:cors -- --apply # pasang kebijakan yang disarankan
   ```

---

## 3. Deploy to Cloudflare Workers

This is a full-stack Next.js app (API routes, middleware, Supabase SSR), so it
runs on **Workers** via the official
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) adapter — not
static hosting.

### One-time setup

```bash
npm install
npx wrangler login      # authenticate your Cloudflare account
```

### Set server-side secrets

`NEXT_PUBLIC_*` vars are baked in at build time; server-only vars go in as
Worker secrets:

```bash
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_BUCKET_NAME
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_COOKIE_SECRET
```

### Build + deploy

> ⚠️ **Build from CI, not your laptop.** `npm run cf:build` bakes every variable
> found in `.env.local` into `.open-next/cloudflare/next-env.mjs`, which ships
> inside the Worker — including `SUPABASE_SERVICE_ROLE_KEY`. The GitHub Action
> is safe (it exports only `NEXT_PUBLIC_*`), so push and let it deploy, or
> verify `next-env.mjs` contains no server secrets before `cf:deploy`.

```bash
npm run cf:build      # next build, then bundle the Worker
npm run cf:deploy     # deploy to Cloudflare
```

First deploy creates a Worker named `portofolio` — rename in
`wrangler.jsonc` if needed.

### Custom domain

Cloudflare dashboard → **Workers & Pages** → `portofolio` → **Settings →
Domains & Routes** → **Add → Custom Domain**. Cloudflare manages DNS
automatically (already the host for your R2 bucket).

### Local preview of the deployed Worker

```bash
npm run cf:preview
```

Copy server-only vars into `.dev.vars` (gitignored, never committed):

```bash
# .dev.vars — server-only vars; NEXT_PUBLIC_* are baked into the build
SUPABASE_SERVICE_ROLE_KEY=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
ADMIN_PASSWORD=...
ADMIN_COOKIE_SECRET=...
```

### Gotchas

- **R2 presigning** uses [`aws4fetch`](https://developers.cloudflare.com/r2/examples/aws/aws4fetch/)
  (SigV4 via Web Crypto), not the AWS SDK — the SDK pulls in Node-only modules
  that don't run on Workers. See `src/lib/r2.ts`.
- **Images** use `images.unoptimized: true` (`next.config.ts`) — required so the
  Worker doesn't need the image-optimization runtime.
- If you previously deployed to Vercel, point DNS at Cloudflare so the domain no
  longer resolves to Vercel.

---

## 4. Customizing

- **Name / about / experience / socials / tech stack** — static content in
  [`src/lib/config.ts`](src/lib/config.ts) (EN + ID).
- **Projects, certifications, gallery photos** — managed live from the admin
  panel (Supabase + R2).
- **Fonts & colors** — accent terracotta `#eb5939`, fonts, and animations in
  [`src/app/globals.css`](src/app/globals.css).

---

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit test (Node test runner via `tsx`) — 52 test |
| `npm run test:watch` | Unit test mode watch |
| `npm run cf:build` | Build Cloudflare Worker bundle |
| `npm run cf:deploy` | Deploy to Cloudflare Workers |
| `npm run cf:preview` | Run Worker locally (`wrangler dev`) |
| `npm run check:cors` | Periksa CORS bucket R2 (`-- --apply` untuk memasang) |
| `npm run og` | Regenerate `public/og.png` (needs Python 3, Pillow, `woff2_decompress`) |

The OG card is a **static file**, not a runtime image route: the site deploys to
Cloudflare Workers, where `satori`/`@vercel/og` would need a WASM font pipeline
and bloat the Worker bundle. Re-run `npm run og` whenever the name, role, or accent
colour changes.

---

## Case study pages

Any project with a `slug` gets a public page at `/work/<slug>`:

- Set **Slug** in `/admin → Projects`. Leave it empty to keep a project
  card-only (no case study link is rendered, so there are never dead links).
- **Case study content (EN/ID)** accepts plain text. Separate paragraphs with a
  blank line; they are rendered as `<p>` elements. Markdown is **not** parsed.
  When left empty, the page falls back to the project's Description.
- The slug is validated (`^[a-z0-9]+(?:-[a-z0-9]+)*$`) before it reaches the
  database, and again on the public route, so a malformed URL 404s instead of
  hitting Supabase.
- Slugs are unique (`projects_slug_unique`), but many projects may have none.

## Contact form

`POST /api/contact` is public; every other method on that path is admin-only
(enforced in `src/middleware.ts`). Messages land in `public.contact_messages`,
which has RLS enabled and **no policies**, so it is invisible to the anon key —
the inbox can only be read through the admin API using `service_role`.

Read them at `/admin → Inbox`, filter by status, and use **Balas** to open a
pre-filled email reply (marking the message as *replied* automatically).

## Storage cleanup (R2)

Every upload gets a unique key, so replacing or deleting an image used to leave
the old file in R2 forever. `src/lib/r2-cleanup.ts` now removes it
automatically after a successful database write, with three safeguards:

1. **Only our own bucket** — a URL is deleted only when it sits under
   `NEXT_PUBLIC_R2_PUBLIC_URL`. External image URLs are never touched.
2. **Never while still referenced** — if another row still points at the same
   file, it is kept. Only a genuinely orphaned file is removed.
3. **Never fails the request** — if the R2 delete errors, the API still
   succeeds; the failure is logged. The database row is the source of truth.

This runs on `PUT` (image replaced) and `DELETE` (row removed) for projects,
certifications, and gallery photos.

## Content ordering

`POST /api/reorder` accepts `{ table, ids }` and writes `sort_order` as the
array index. `table` is checked against an allowlist, and every id must be a
valid UUID — so the endpoint cannot be pointed at another table or used to
inject filters. Public pages read `sort_order` ascending with the same
tiebreaker as the admin list, so what you arrange is what visitors see.

## Editing site content

Text that used to be hardcoded in `src/lib/config.ts` can now be edited at
`/admin → Site`. The design is deliberately **config-first**:

- `config.ts` is the **default**; the database only **overrides** it.
- A section that was never edited, or a table that doesn't exist yet, falls back
  to the code — the site is never blank.
- Each section is one row in `site_content` (JSONB), so two people editing
  different sections can't overwrite each other.
- Saving validates that the shape matches the default (object stays an object,
  array stays an array), so malformed data can't reach the database.
- **Reset** on a section deletes the override and restores the code default.

Values are merged per key: overriding `profile.name` keeps `profile.socials`
and every other key from the default.

## Analytics

Cookie-less, no PII, and **off unless you turn it on**:

```bash
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

What is recorded: the path, the referrer **hostname only** (no query strings),
and a salted HMAC of IP + user agent used solely to count unique visitors.
No cookies, no tracking IDs, no raw IPs. `/admin` views are never counted, and
the client skips tracking entirely when the browser sends Do Not Track.

View the summary at `/admin → Stats` (totals, unique visitors, per-day chart,
top pages, referrer sources). `page_views` has RLS enabled with no policies, so
it is unreadable from the browser — only the admin API can read it.

To disable again, set the flag to `false` and redeploy.

## Security

Ringkasan pertahanan yang berlaku sekarang:

| Area | Mekanisme |
| --- | --- |
| Login admin | Password dari `ADMIN_PASSWORD` (tanpa default, fail-closed). Sesi = token HMAC-SHA256 dengan expiry 7 hari. |
| Brute-force | Rate-limit 8 percobaan gagal / 15 menit per IP, lalu lockout progresif. **In-memory per isolate** — tambahkan Cloudflare WAF rate-limit rule pada `/api/admin/login` untuk batas keras. |
| Unggahan | Presign hanya untuk allowlist tipe (JPEG/PNG/WebP/AVIF/GIF/PDF), allowlist folder, dan `size` wajib angka. **SVG & HTML ditolak** karena bisa membawa skrip di origin CDN. |
| Otorisasi API | Middleware menolak tanpa sesi; setiap handler juga memanggil `requireUser()` (dua lapis). |
| Inbox kontak | Tabel `contact_messages` RLS aktif **tanpa policy** — tidak terbaca dari browser. |
| Guestbook | Komentar baru berstatus `pending`; hanya tayang setelah disetujui admin. |
| Rahasia | Hanya di Worker secrets / `.env.local` (gitignored). Deploy lewat CI supaya secret tidak ter-bake ke artefak build lokal. |
| Analytics | Tanpa cookie & tanpa PII; IP disimpan sebagai hash ber-salt. |

Panduan lengkap + langkah rotasi secret ada di [`AUDIT.md`](AUDIT.md) (dokumen
historis, berisi tabel status terkini).

## Testing

```bash
npm test          # sekali jalan
npm run test:watch
```

Memakai **test runner bawaan Node** (`node:test`) lewat `tsx` untuk menjalankan
TypeScript langsung — tanpa Jest/Vitest, jadi tidak ada dependensi tambahan.

Yang diuji adalah logika yang berisiko merusak data atau keamanan, bukan
markup:

| Berkas | Yang dikunci |
| --- | --- |
| `tests/slug.test.ts` | `slugify` selalu menghasilkan slug valid; `isValidSlug` menolak path traversal, garis miring, dan huruf besar |
| `tests/r2-cleanup.test.ts` | Hanya URL di bawah bucket sendiri yang boleh dihapus; domain mirip (`cdn.example.com.evil.com`) dan `..` ditolak; tanpa konfigurasi → fail-closed |
| `tests/site-content.test.ts` | Default selalu lengkap; override sebagian tidak menghapus key lain; data bentuk salah diabaikan, bukan merusak halaman |
| `tests/reorder-validation.test.ts` | Daftar putih tabel; id wajib UUID; duplikat dan >500 item ditolak |

CI menjalankan `lint` → `typecheck` → `test` **sebelum** build, sehingga kode
bermasalah tidak sampai ter-deploy.
