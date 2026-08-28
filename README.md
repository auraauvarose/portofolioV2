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

- Hero with cursor-following orange lens reveal, About, What I Do, Experience,
  Education, Certifications, Tech Stack, Showcase (Projects & Photo Gallery), Contact, Footer
- Letter-by-letter text reveal, marquee strips, scroll-reveal animations,
  gallery lightbox with keyboard navigation, custom cursor, music player
- Loading curtain on every visit — inline in `HomeClient.tsx`, no separate
  `/loading` route

**Admin panel** (`/admin`, accessed directly by URL — no button on the public
site; password-only login, default `aura2007`)

- **Projects** — title (EN+ID), description, tech stack, category, year, link,
  image, featured
- **Certifications** — title (EN+ID), issuer, category, date, description,
  certificate file
- **Gallery** — photo uploads (title EN+ID, category)
- Uploads accept **images and PDFs** → Cloudflare R2 directly from the browser;
  **max file size 50 MB**

**Security**

- Row-level security on all tables — public **read**, server-side **writes only**
  via admin API routes protected by an admin password cookie
- `SUPABASE_SERVICE_ROLE_KEY` never touches the browser
- Middleware guards `/admin`

---

## Project structure

```
portofolioV2/
├── .github/workflows/       # CI/CD (deploy.yml)
├── public/
│   ├── fonts/               # self-hosted fonts (Tanker, Switzer, …)
│   └── …                    # images, cv.pdf, mp3
├── scripts/                 # r2 CORS checker, font downloader
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
pnpm install
cp .env.example .env.local   # then fill in every value (see below)
pnpm dev
```

Open <http://localhost:3000>. Admin panel: <http://localhost:3000/admin>.

> Requires Node 18.17+ / 20+ and `pnpm` (or npm — scripts work with either).

---

## Environment variables

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key — server-side writes only |
| `ADMIN_PASSWORD` | Admin panel password (default `aura2007`) |
| `ADMIN_COOKIE_SECRET` | Optional extra secret for the admin session cookie |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | R2 bucket name |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Public base URL for uploaded files |

`NEXT_PUBLIC_*` vars are inlined at build time. Server-only vars
(`SUPABASE_SERVICE_ROLE_KEY`, `R2_*`, `ADMIN_*`) must also be set as Worker
secrets for production (see [Deploy](#3-deploy-to-cloudflare-workers)).

---

## 1. Supabase setup

1. Create a project at <https://supabase.com>.
2. **SQL Editor → New query** → paste the entire contents of
   [`supabase/schema.sql`](supabase/schema.sql) → **Run**. This creates the
   `projects`, `certifications`, and `gallery_photos` tables with RLS and seed
   data.
3. Copy credentials from **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server-side only — never
     expose it to the browser or commit it)

> **Security model:** RLS allows public **reads**; **writes** go through the
> server-side admin API routes, protected by the admin password cookie
> (`/admin/login`). Default password `aura2007` — override with
> `ADMIN_PASSWORD` in `.env.local`.

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

---

## 3. Deploy to Cloudflare Workers

This is a full-stack Next.js app (API routes, middleware, Supabase SSR), so it
runs on **Workers** via the official
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) adapter — not
static hosting.

### One-time setup

```bash
pnpm install
pnpm wrangler login      # authenticate your Cloudflare account
```

### Set server-side secrets

`NEXT_PUBLIC_*` vars are baked in at build time; server-only vars go in as
Worker secrets:

```bash
pnpm wrangler secret put SUPABASE_SERVICE_ROLE_KEY
pnpm wrangler secret put R2_ACCOUNT_ID
pnpm wrangler secret put R2_ACCESS_KEY_ID
pnpm wrangler secret put R2_SECRET_ACCESS_KEY
pnpm wrangler secret put R2_BUCKET_NAME
pnpm wrangler secret put ADMIN_PASSWORD
pnpm wrangler secret put ADMIN_COOKIE_SECRET
```

### Build + deploy

```bash
pnpm cf:build      # next build, then bundle the Worker
pnpm cf:deploy     # deploy to Cloudflare
```

First deploy creates a Worker named `portofolio` — rename in
`wrangler.jsonc` if needed.

### Custom domain

Cloudflare dashboard → **Workers & Pages** → `portofolio` → **Settings →
Domains & Routes** → **Add → Custom Domain**. Cloudflare manages DNS
automatically (already the host for your R2 bucket).

### Local preview of the deployed Worker

```bash
pnpm cf:preview
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
| `pnpm dev` | Next.js dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm lint` | Lint |
| `pnpm cf:build` | Build Cloudflare Worker bundle |
| `pnpm cf:deploy` | Deploy to Cloudflare Workers |
| `pnpm cf:preview` | Run Worker locally (`wrangler dev`) |
