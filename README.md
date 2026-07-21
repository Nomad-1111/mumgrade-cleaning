# Mum Grade Cleaning

Hipages-style cleaning marketplace: post a job, compare quotes, browse local providers.

Hosted on **Cloudflare Pages** with **Pages Functions (Hono)** and **D1**.

## Stack

- Vite + React + TypeScript + Tailwind CSS
- React Router
- Cloudflare Pages Functions + Hono (`/api/*`)
- Cloudflare D1 (SQLite)

## Brand palette

| Token | Hex | Use |
| --- | --- | --- |
| Sage | `#8FA898` | Primary CTAs |
| Olive | `#4A5D3E` | Headings / hover |
| Cream | `#F7F3EC` | Page background |
| Sand | `#E8DFD0` | Secondary surfaces |
| Charcoal | `#2C2C2C` | Body text |

Hero image: `public/brand/hero.png`  
Logo: `public/brand/logo.jpg`

## Local setup

```bash
npm install
npm run db:migrate
npm run build
npm run dev:cf
```

- `npm run dev` — Vite UI only (API calls need the CF stack; Vite proxies `/api` to port `8788`).
- `npm run dev:cf` — full local Pages + Functions + D1 (recommended for marketplace flows).
- `npm run db:migrate` — apply D1 migrations locally (includes demo seed data).

Open the URL Wrangler prints (usually `http://127.0.0.1:8788`).

### Demo data

After migrate you should see seeded providers (Bondi, Newtown, Manly) and a sample job at `/jobs/job_demo_1`.

## Deploy to Cloudflare Pages

1. Create a D1 database:

```bash
npx wrangler d1 create mumgrade-cleaning
```

2. Put the returned `database_id` into `wrangler.toml`.

3. Apply migrations remotely:

```bash
npm run db:migrate:remote
```

4. Deploy:

```bash
npm run deploy
```

Or connect the GitHub repo in the Cloudflare dashboard (build command `npm run build`, output `dist`). Bind the D1 database as `DB` in the Pages project settings.

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Health check |
| GET | `/api/providers` | List providers (`?suburb=`) |
| GET | `/api/providers/:id` | Provider detail |
| POST | `/api/providers` | Create provider |
| POST | `/api/jobs` | Create job |
| GET | `/api/jobs/:id` | Job detail |
| GET | `/api/jobs/:id/quotes` | Quotes for job |
| POST | `/api/jobs/:id/quotes` | Add quote |

Auth is deferred for this init — contact details are stored on job/provider rows.
