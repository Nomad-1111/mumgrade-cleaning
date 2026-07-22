# Mum Grade Cleaning

Hipages-style cleaning marketplace: post a job, compare quotes, browse local providers, and (for joined providers) access training videos.

Hosted on **Cloudflare Pages** with **Pages Functions (Hono)**, **D1**, and **R2**.

## Stack

- Vite + React + TypeScript + Tailwind CSS
- React Router
- Cloudflare Pages Functions + Hono (`/api/*`)
- Cloudflare D1 (SQLite)
- Cloudflare R2 (training video storage)
- Provider magic-link auth (session cookie)

## Brand palette

| Token | Hex | Use |
| --- | --- | --- |
| Sage | `#8FA898` | Primary CTAs |
| Olive | `#4A5D3E` | Headings / hover |
| Cream | `#F7F3EC` | Page background |
| Sand | `#E8DFD0` | Secondary surfaces |
| Charcoal | `#2C2C2C` | Body text |

Hero image: `public/brand/hero.png`  
Logo: `public/brand/logo.png`  
Suburb dataset: `public/data/au-suburbs.json` (~18k AU localities)

## Local setup

```bash
cp .dev.vars.example .dev.vars   # ADMIN_SECRET + DEV_AUTH
npm install
npm run db:migrate
npm run build
npm run dev:full
```

- `npm run dev:full` — **recommended**: Vite hot reload (UI) + Wrangler API/D1/R2 on port `8788`.
- `npm run dev` / `npm run dev:api` — split terminals if preferred.
- `npm run db:migrate` — apply D1 migrations (includes demo providers).

### Training videos (owner + providers)

1. **Owner upload:** open `/admin/training`, unlock with `ADMIN_SECRET` (local default `dev-admin-secret`), upload a video to R2.
2. **Provider access:** join at `/join` (or use a seeded provider email), then `/login` → magic link (shown in the UI when `DEV_AUTH=1` / no Resend key) → `/training`.

Production secrets (Pages → Settings → Environment variables):

- `ADMIN_SECRET`
- Optional: `RESEND_API_KEY`, `MAGIC_LINK_FROM`, `APP_ORIGIN`
- Bind R2 bucket as `TRAINING_VIDEOS` (see `wrangler.toml`)

Create the R2 bucket once:

```bash
npx wrangler r2 bucket create mumgrade-training-videos
```

## Deploy to Cloudflare Pages

1. Ensure D1 + R2 bindings match `wrangler.toml`.
2. `npm run db:migrate:remote`
3. Set secrets above.
4. `npm run deploy` (or Git-connected Pages).

## API (selected)

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/auth/magic-link` | Email a provider login link |
| POST | `/api/auth/verify` | Exchange token for session cookie |
| GET | `/api/auth/me` | Current provider session |
| GET | `/api/training` | Published videos (auth required) |
| GET | `/api/training/:id/media` | Stream video from R2 (auth required) |
| GET/POST/PATCH/DELETE | `/api/admin/training` | Owner library (`X-Admin-Secret`) |
