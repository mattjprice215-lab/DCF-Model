# Portfolio Intelligence Dashboard (Vercel-ready)

This repository is now a **Next.js 15** dashboard that is ready to deploy on Vercel.

It provides:
- Holdings upload via CSV (`ticker`, `shares`, `cost_basis`, optional `target_weight`)
- Concentration analytics (position + sector exposure)
- Growth expectation estimates (blended growth + analyst upside)
- Scenario simulation (target weights + optional cash deployment)
- Rule-based action suggestions (technicals + fundamentals + analyst metrics)
- Photo uploads for thesis screenshots/notes

## Tech stack

- Next.js App Router (TypeScript)
- API route (`/api/portfolio-data`) to enrich holdings with Yahoo Finance data
- Recharts for visualizations
- PapaParse for CSV parsing

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## CSV format

Required headers:
- `ticker`
- `shares`
- `cost_basis`

Optional header:
- `target_weight` (decimal, e.g. `0.20`)

## Deploy to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import the repo in Vercel.
3. Framework preset: **Next.js** (auto-detected).
4. Build command: `npm run build` (default)
5. Output: `.next` (default)
6. Deploy.

No additional environment variables are required for the default Yahoo Finance integration.

## Disclaimer

The analytics and suggestions are heuristic and are **not investment advice**.
