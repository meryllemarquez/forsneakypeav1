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

## Deferred schema items (found while building the Flyway baseline)

Nothing here has been changed in the live database.

- **V2 indexes (approved, not applied):** `fsp_backend/src/main/resources/db/pending/V2__add_missing_indexes.sql` holds five indexes from `db/*.sql` that are missing in live (`idx_love_notes_is_archived`, `_is_favorite`, `_created_by`, `_updated_at`, `idx_love_stickers_created_by`). Move the file to `db/migration/` to apply it on the next deploy.
- **Duplicate indexes to drop later:** `idx_memory_folders_archived` / `idx_memory_folders_is_archived` (both on `is_archived`) and `idx_memory_photos_folder` / `idx_memory_photos_folder_id` (both on `folder_id`). Kept in V1 so it matches live.
- **`users.created_at` / `updated_at`:** live columns are `timestamp` (no time zone) but the entity maps them as `OffsetDateTime`. Hibernate validate accepts it; worth aligning (column to `timestamptz`, or entity to `LocalDateTime`).
- **`activity_logs.status` nullability:** `NOT NULL DEFAULT 'SUCCESS'` in live, but the entity has no `nullable = false`.
- **`users_accent_color_check` missing in live:** defined in `profile_customization_migration.sql` (`accent_color` limited to the six palette values) but never applied. The service layer validates the palette; adding the constraint is a decision for later.
- **`memory_folders_calendar_date_unique` (needs a decision):** a UNIQUE partial index on `memory_folders(event_date)` where `is_calendar_highlight = true AND highlight_photo_id IS NOT NULL` ("one calendar-highlight album per date"). Not in live; adding it changes behaviour and fails if existing rows violate it. Left commented out in V2.
- **Also noted:** `users.created_by` exists in live but not in the entity.

## Migrations connection

Flyway migrates through Supabase's session pooler (`:5432`, same host and credentials) while the app keeps the transaction pooler (`:6543`); see `FlywayConfig`. Checked read-only against live: connects, advisory locks work, `flyway info` does not create the history table.

## Backup

A schema+data `pg_dump` of the `public` schema was taken before the Flyway rollout and stored outside the repo (`C:\Users\Merylle\Desktop\backups\forsneakypea-2026-10-23.sql`). It contains private data and must never be committed.

## How to run

```bash
BACKEND_URL=https://<service>.onrender.com/api/v1 TOKEN=<jwt> ./scripts/measure.sh
```
```powershell
$env:BACKEND_URL="https://<service>.onrender.com/api/v1"; $env:TOKEN="<jwt>"; .\scripts\measure.ps1
```
