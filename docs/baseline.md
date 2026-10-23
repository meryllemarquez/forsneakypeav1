# Performance baseline (Phase 0)

Measured 2026-10-23, before any optimization. Branch: `perf-improvements`.

## Infrastructure

| Item | Value |
|---|---|
| Supabase region | Seoul (`ap-northeast-2`) - from pooler host `aws-1-ap-northeast-2.pooler.supabase.com:6543` (transaction pooler) |
| DB pool (Hikari) | max 5, min idle 2, `prepareThreshold=0` |
| Frontend | Vercel - https://forsneakypea.vercel.app |
| Render region | Singapore (service `forsneakypeav1`; moved from Virginia) |
| Render plan | Free |

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

## Region comparison (warm, ms)

Free-plan Render service, Supabase in Seoul. Figures are as reported by the owner; the exact script run (median of 5, total time) was not recorded here.

| Endpoint | Virginia | Singapore |
|---|---|---|
| `GET /memories/folders` | 1235 | 649 |
| `GET /dates` | 1437 | 609 |
| `GET /love-board/notes` | 1159 | 497 |
| Network floor | ~310 | ~150 |

## Boot time

| Region | Boot time |
|---|---|
| Singapore (Free plan) | 140.8 s |

## Startup time, local Docker (Step A: Flyway/validate, JVM flags, AppCDS)

"Started FspBackendApplication in X seconds", same machine, same Docker Desktop. Before = `ddl-auto=update`, `-XX:MaxRAMPercentage=75`, no CDS. After = `validate` + Flyway baseline, C1-only JIT, SerialGC, 60% heap, AppCDS archive.

| Scenario | Before | After |
|---|---|---|
| Local Postgres, unconstrained (2 runs) | 17.7 s / 12.6 s | 5.3 s / 5.9 s |
| Live Supabase, unconstrained (2 runs; Flyway off for "after", see note) | 16.6 s / 15.5 s | 8.7 s / 6.3 s |
| Local Postgres, `--cpus=0.25 --memory=512m` | 75.5 s | 24.4 s |

Render Free (140.8 s measured) has less CPU than any of these, so expect a smaller absolute number but a similar ratio. Note: "after" against live Supabase ran with Flyway disabled so no DDL touched the live DB; the Flyway baseline step itself was measured on local Postgres (included in the "after" local numbers).

## How to run

```bash
BACKEND_URL=https://<service>.onrender.com/api/v1 TOKEN=<jwt> ./scripts/measure.sh
```
```powershell
$env:BACKEND_URL="https://<service>.onrender.com/api/v1"; $env:TOKEN="<jwt>"; .\scripts\measure.ps1
```
