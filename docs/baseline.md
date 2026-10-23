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

## Database round trips per request (Step B)

SQL statements Hibernate prepared per request (includes the auth user lookup), measured with Hibernate statistics against a local Postgres restored from the backup, so the writes had no effect on live. 5 notification recipients in that data set; with the real two accounts there is 1 recipient, so write paths are cheaper both before and after. "After" is steady state (user cache warm); a cold cache adds 1 query on the first request per user.

| Request | Before | After |
|---|---|---|
| GET folders | 3 | 2 |
| GET dates | 5 | 4 |
| GET love-board notes | 3 | 2 |
| GET notifications | 2 | 1 |
| GET memories/calendar (4 highlighted folders) | 6 | 2 |
| Favorite a date | 8 | 6 |
| Create a folder | 10 | 4 |
| Edit a note (notifies partner) | 10 | 5 |
| Edit the same note again within 10 min | 10 | 4 (no new notification) |
| Drag a note (PATCH position) | 4 | 2 |
| GET admin dashboard | 18 (loaded whole tables) | 8 |

## Frontend data layer and bundle (Step C)

Measured with a production build served by `vite preview`, driven by headless Chrome against the real backend (local Postgres).

**API calls on page load** (first load of the page; `GET` unless noted)

| Page | Before | After |
|---|---|---|
| Home | notifications, folders, dates, love-board notes (4) | notifications, `home/summary` (2) |
| Memories | notifications, folders (2) | notifications, folders (2) |
| Dates | dates, date-categories (2) | dates, date-categories (2) |
| Love Letters | notes, stickers (2) | notes, stickers (2) |

Navigating between pages without reloading (Home, Memories, Dates, Letters, Home, Memories, Dates): before, every visit re-fetched (3 calls going back to Home, 1-2 for the others); after, revisiting a page within its freshness window (30-60 s, notifications 15 s) makes **0 calls** and shows cached data instantly, then re-validates in the background once stale.

`GET /home/summary` returns 1.2 KB in 4 SQL queries; the three list calls it replaces returned 34 KB in 8 SQL queries (same seed data).

**JS + CSS loaded per route** (raw / gzip)

| Route | Before | After |
|---|---|---|
| /home | 998 KB / 270 KB | 748 KB / 220 KB |
| /memories | 998 KB / 270 KB | 826 KB / 238 KB |
| /dates | 998 KB / 270 KB | 832 KB / 240 KB |
| /letters | 998 KB / 270 KB | 876 KB / 250 KB |

**Build chunks**

| Chunk | Before | After |
|---|---|---|
| main `index-*.js` | 860.4 kB (gzip 247.5) | 668.7 kB (gzip 197.4) |
| main `index-*.css` | 151.5 kB (gzip 26.8) | 42.6 kB (gzip 9.1) |
| MemoriesPage (lazy) | in main | 45.5 kB (gzip 11.5) + 34.0 kB css |
| DatesPage (lazy) | in main | 55.1 kB (gzip 14.1) + 31.0 kB css |
| LoveLettersPage (lazy) | in main | 84.7 kB (gzip 21.7) + 44.6 kB css |
| html2canvas (already lazy) | 199.6 kB | 199.6 kB |
| shared `axiosConfig` chunk | in main | 46.0 kB (gzip 17.4) |

The main chunk is still large (React, router, framer-motion, supabase-js, TanStack Query). The Supabase client is only needed for photo/avatar uploads and could be split out next.

**Mutations and the queries they refresh** (see `fsp_frontend/src/queries/mutations.js`)

| Mutation | Refreshes |
|---|---|
| Create/edit/delete album, add/edit/delete photo, set/clear calendar highlight | folders, calendar, home |
| Reposition calendar highlight | folders (calendar view is updated optimistically) |
| Create/edit/delete/archive/unarchive/duplicate date | dates, home |
| Favorite a date | dates (marked stale; the heart is flipped optimistically) |
| Checklist add/toggle/edit/delete/reorder | dates (marked stale; counts are patched optimistically) |
| Create/edit/delete love note | home (the board writes the returned note into its cache) |
| Drag a note (position PATCH, 204) | nothing on success (optimistic); resyncs love-notes if it fails |
| Create/edit/delete sticker | nothing on success (board updates its cache); resyncs stickers if an edit fails |
| Save profile / avatar | profile (cache set to the saved profile) |
| Mark read / mark all read / delete notification | notifications (optimistic, resynced when settled) |

Login and logout both clear the whole query cache. Checked with a negative control: with the clear removed, a second user signing in on the same browser saw the first user's profile and notifications; with it, they do not.

## Deferred schema items (found while building the Flyway baseline)

Nothing here has been changed in the live database.

- **V2 indexes (approved, moved to `db/migration/`):** `V2__add_missing_indexes.sql` adds five indexes from `db/*.sql` that are missing in live (`idx_love_notes_is_archived`, `_is_favorite`, `_created_by`, `_updated_at`, `idx_love_stickers_created_by`).
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
