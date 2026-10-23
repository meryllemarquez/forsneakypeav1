# Performance baseline (Phase 0)

Measured 2026-10-23, before any optimization. Branch: `perf-improvements`.

## Infrastructure

| Item | Value |
|---|---|
| Supabase region | `ap-northeast-2` (Seoul) - from pooler host `aws-1-ap-northeast-2.pooler.supabase.com:6543` (transaction pooler) |
| DB pool (Hikari) | max 5, min idle 2, `prepareThreshold=0` |
| Frontend | Vercel - https://forsneakypea.vercel.app |
| Render region | _(fill in)_ |
| Render plan | _(fill in)_ |

## Lighthouse (mobile, performance only, Lighthouse 12.8.2, 3 runs)

URL tested: https://forsneakypea.vercel.app (redirects to `/auth`, so this is the login page, not Home).

| Run | Score | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|
| 1 | 81 | 3.68 s | 3.68 s | 90 ms | 0.038 |
| 2 | 56 | 3.91 s | 18.91 s | 263 ms | 0.038 |
| 3 | 64 | 3.74 s | 18.69 s | 22 ms | 0.038 |
| **Median** | **64** | **3.74 s** | **18.69 s** | **90 ms** | **0.038** |

Medians are per metric. LCP varies a lot (3.7 s vs ~18.8 s); runs 2 and 3 likely waited on something slow (image or API) - to investigate in the next phase.

| Page | Score | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|
| Home page (logged in) | _(fill in)_ | | | | |

## Backend (`scripts/measure.sh` / `measure.ps1`)

| Measurement | Connect | TTFB | Total | Notes |
|---|---|---|---|---|
| Cold start (unauthenticated, after 20+ min idle) | _(fill in)_ | _(fill in)_ | _(fill in)_ | |
| Warm unauthenticated | _(fill in)_ | _(fill in)_ | _(fill in)_ | |
| `GET /memories/folders?includeArchived=false` (median of 5) | _(fill in)_ | _(fill in)_ | _(fill in)_ | |
| `GET /dates?includeArchived=false` (median of 5) | _(fill in)_ | _(fill in)_ | _(fill in)_ | |
| `GET /love-board/notes` (median of 5) | _(fill in)_ | _(fill in)_ | _(fill in)_ | |

Home page calls these three endpoints in parallel on mount (`HomePage.jsx`).

## How to run

```bash
BACKEND_URL=https://<service>.onrender.com/api/v1 TOKEN=<jwt> ./scripts/measure.sh
```
```powershell
$env:BACKEND_URL="https://<service>.onrender.com/api/v1"; $env:TOKEN="<jwt>"; .\scripts\measure.ps1
```
