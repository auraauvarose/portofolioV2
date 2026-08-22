# Portfolio V2 — Aura Auvarose

A dark, orange-accented (terracotta `#eb5939`) portfolio site for **Aura Auvarose**,
built as a full-stack app with an **admin panel** for managing
**projects, certifications, and a photo gallery**.

- **Frontend:** Next.js 15 (App Router) + React 19 + Tailwind CSS v4
- **Hosting:** Cloudflare Workers (via `@opennextjs/cloudflare`)
- **Database + Auth:** Supabase (PostgreSQL) + password-only admin panel
- **File storage:** Cloudflare R2 (presigned direct-to-browser uploads)

Bilingual **EN / ID** with a language toggle.

---

## Features

- Hero, About, What I Do, Experience, Education, Certifications, Tech Stack,
  How I Work, Projects (Selected Works), **Photo Gallery**, Contact, Footer
- Letter-by-letter text reveal, marquee strips, scroll-reveal animations,
  gallery lightbox with keyboard navigation
- Admin panel at `/admin` (accessed directly by URL — no button on the public site;
  login is password-only, default password `aura2007`):
  - Create / edit / delete **projects** (title EN+ID, description, tech stack,
    category, year, link, image, featured)
  - Create / edit / delete **certifications** (title EN+ID, issuer, category,
    date, description, certificate file)
  - Upload **gallery photos** (title EN+ID, category)
  - Uploads accept **images and PDFs**; files go straight to Cloudflare R2;
    **max file size 50 MB**
- On **every visit/reload**, a loading curtain covers the page, plays a short
  greeting animation, then slides away to reveal the home content. It runs inline
  in `HomeClient.tsx` on a dark backdrop (white loading text in both themes); there
  is no separate `/loading` route.

---

## Project structure

```
portofolioV2/
├── supabase/schema.sql          # DB tables + RLS + seed data
├── src/
│   ├── app/
│   │   ├── page.tsx             # public home (server-rendered)
│   │   ├── admin/               # admin panel + login
│   │   └── api/                 # upload presign + CRUD routes
│   ├── components/              # UI sections + admin managers
│   ├── lib/                     # supabase client, r2, data access, config
│   └── middleware.ts            # protects /admin routes
├── .env.example
└── package.json
```

---

## 1. Supabase setup

1. Create a project at <https://supabase.com>.
2. Open **SQL Editor** → New query, paste the entire contents of
   [`supabase/schema.sql`](supabase/schema.sql), and **Run**. This creates the
   `projects`, `certifications`, and `gallery_photos` tables, row-level
   security, and seed data.
3. Copy your credentials from **Project Settings → API**:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
     (server-side only — used for writes via the admin API routes. Never expose
     it to the browser or commit it.)

> Security: row-level security allows anyone to **read**, but **writes are only
> performed through the server-side admin API routes**, which are protected by
> the admin password cookie (`/admin/login`). The default admin password is
> `aura2007` — override it with `ADMIN_PASSWORD` in `.env.local`.

---

## 2. Cloudflare R2 setup

1. In the Cloudflare dashboard → **R2**, create a bucket (e.g. `portfolio`).
2. Make the bucket publicly readable so your site can load images. The best
   option is a **custom domain** (R2 → your bucket → Settings → Custom Domains),
   e.g. `cdn.yourdomain.com`. (The default `*.r2.dev` subdomain works but is
   rate-limited and should not be used in production.)
3. Create an API token: **R2 → Manage R2 API Tokens → Create API token**, grant
   **Object Read & Write** on that bucket. Copy:
   - `Access Key ID` → `R2_ACCESS_KEY_ID`
   - `Secret Access Key` → `R2_SECRET_ACCESS_KEY`
4. Find your **Account ID** at the top-right of the Cloudflare dashboard →
   `R2_ACCOUNT_ID`.
5. Set `R2_BUCKET_NAME` to your bucket name.
6. Set `NEXT_PUBLIC_R2_PUBLIC_URL` to the public base URL (e.g.
   `https://cdn.yourdomain.com` or `https://pub-xxxx.r2.dev`).
7. **Add a CORS policy on the bucket** (required for browser uploads). In
   **R2 → your bucket → Settings → CORS Policy**, set a policy (this is what
   makes the admin "Upload" work — without it you get `Failed to fetch`):

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

   > For production you can replace `"*"` with your exact domain
   > (e.g. `https://auraauvarosee.vercel.app`). TypeScript code will also
   > surface a clear CORS hint in the admin UI if this is missing.

---

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in every value:

```bash
cp .env.example .env.local
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key (server-side writes) |
| `ADMIN_PASSWORD` | Admin panel password (default `aura2007`) |
| `ADMIN_COOKIE_SECRET` | Optional extra secret for the admin session cookie |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | R2 bucket name |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Public base URL for uploaded files |

---

## 4. Run locally

```bash
pnpm install
pnpm dev
or npm run dev
```

Open <http://localhost:3000>. The admin panel is at <http://localhost:3000/admin>.

---

## 5. Deploy to Cloudflare Workers

The app is a full-stack Next.js app (API routes, middleware, Supabase SSR), so it
runs on **Cloudflare Workers** via the official
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) adapter — not on
Cloudflare Pages static hosting.

### 5.1 One-time setup

```bash
pnpm install
pnpm wrangler login      # opens the browser, authenticates your Cloudflare account
```

### 5.2 Set server-side secrets

The `NEXT_PUBLIC_*` vars are inlined at build time (from `.env.local`), so they
don't need to be secrets. The server-only vars must be set as Worker secrets:

```bash
pnpm wrangler secret put SUPABASE_SERVICE_ROLE_KEY
pnpm wrangler secret put R2_ACCOUNT_ID
pnpm wrangler secret put R2_ACCESS_KEY_ID
pnpm wrangler secret put R2_SECRET_ACCESS_KEY
pnpm wrangler secret put R2_BUCKET_NAME
pnpm wrangler secret put ADMIN_PASSWORD
pnpm wrangler secret put ADMIN_COOKIE_SECRET
```

Paste the same values you use in `.env.local` when each prompt appears.

### 5.3 Build + deploy

```bash
pnpm cf:build      # runs next build, then bundles the Worker
pnpm cf:deploy     # deploys the Worker to Cloudflare
```

The first deploy creates a Worker named `portofolio-v2`. You can change the name
in `wrangler.jsonc`.

### 5.4 Attach a custom domain

Cloudflare dashboard → **Workers & Pages** → `portofolio-v2` → **Settings →
Domains & Routes** → **Add → Custom Domain** → your domain. Cloudflare manages the
DNS automatically (it's already the host for your R2 bucket).

### 5.5 Local preview (the deployed Worker)

```bash
pnpm cf:preview        # runs the Worker locally via wrangler dev
```

For local preview, copy your server-only env vars into `.dev.vars` (gitignored,
never committed) so the local Worker can access them:

```bash
# .dev.vars (server-only vars; NEXT_PUBLIC_* are baked into the build)
SUPABASE_SERVICE_ROLE_KEY=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
ADMIN_PASSWORD=...
ADMIN_COOKIE_SECRET=...
```

### 5.6 Notes / gotchas

- **R2 presigning** uses [`aws4fetch`](https://developers.cloudflare.com/r2/examples/aws/aws4fetch/)
  (SigV4 via Web Crypto), not the AWS SDK — the SDK pulls in Node-only modules
  (`http`/`fs`) that don't run on Workers. See `src/lib/r2.ts`.
- **Images** use `images.unoptimized: true` (see `next.config.ts`) — required so
  the Worker doesn't need the image-optimization runtime.
- If you previously deployed to Vercel, remove the Vercel project or point the
  DNS at Cloudflare so the domain no longer resolves to Vercel.

The admin login is at `https://your-domain.pages.dev/admin` (or your custom domain).

> Note: `next dev` still works locally as before. Only the production deployment
> target changed.

---

## 6. Customizing

- **Your name / about / experience / socials / tech stack** are static content
  in [`src/lib/config.ts`](src/lib/config.ts) — edit them there (EN + ID).
- **Projects, certifications, and gallery photos** are managed live from the
  admin panel (stored in Supabase, images in R2).
- **Fonts & colors:** the accent (terracotta orange `#eb5939`), fonts, and
  animations live in
  [`src/app/globals.css`](src/app/globals.css).



