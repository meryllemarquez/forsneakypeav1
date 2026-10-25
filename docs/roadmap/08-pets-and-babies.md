# 08 · Pets & babies (dogs and plushies we look after together)

## 1. Goal and user flow
A calm, cuddly corner of the app: nine "babies" we both look after. Five dogs (Zizi, Loafie, Zoey, Tato, Cooper) and four plushies (Junebug the avocado, Chimken the long hotdog-shaped avocado, Rorry the reversible octopus, Skyrie the bear-head plush with a rainbow beanie). We can feed, play, hug and (dogs only) walk them. Each action plays a cute reaction. Mood, hunger and energy are **computed from timestamps** when read, stored in **one small row per pet**, with no background jobs and no per-minute writes. Both of us see the same pets. Copy is always gentle: no guilt, no "neglected", no streaks.

**Flow (phone).** Home -> small "Our little ones" widget (4 pet faces + one warm line) -> tap -> `/pets` (the pet room) -> tap a pet tile -> the stage shows that pet big, its three soft meters (full tummy, energy, joy) and action buttons -> tap **Feed** -> food flies in, pet chomps, a Caveat bubble says "nom nom" -> meters ease up -> tap **Hug** -> squish + hearts -> back to the room. The partner's actions show up as a line ("Cj hugged Zoey · 2h ago") the next time we look.

## 2. UX spec

### Characters (`constants/pets.js`, the single source for names, kinds and looks)
| id | Name | Kind | Icon today | Notes |
|---|---|---|---|---|
| `zizi` | Zizi | dog | `dog` | |
| `loafie` | Loafie | dog | `dog` | |
| `zoey` | Zoey | dog | `dog` | |
| `tato` | Tato | dog | `dog` | |
| `cooper` | Cooper | dog | `dog` | |
| `junebug` | Junebug | plush | `plush` | avocado |
| `chimken` | Chimken | plush | `chimken` | long hotdog-shaped avocado |
| `rorry` | Rorry | plush | `rorry` | reversible octopus (teal grumpy <-> pink happy); `RORRY_BODY` path is exported from `glyphs.jsx` |
| `skyrie` | Skyrie | plush | `ball` | bear-head plush, rainbow beanie |
The kit has ONE `dog` doodle. To tell five dogs apart without new drawings, each dog gets a **collar** (small SVG band + round tag in a palette colour: Zizi `sea`, Loafie `citrus`, Zoey `gelato`, Tato `amalfi`, Cooper `white`) drawn over the dog, a name tag under the figure, and an optional `coat` tint overlay (`mix-blend-mode: multiply` with a pale tint) driven by `constants/pets.js`; a TODO comment lets Chicken/Junebug later swap in real per-dog drawings (`dogZizi`, ...) by changing the `icon` field. Do not invent specific real-life coat colours; defaults are neutral.

### Pet room (`/pets`)
- Route `/pets` (protected, `ROLE_USER`), lazy-loaded. Entry points: the Home widget, and optionally a link in the Profile page. Not in the 4-item nav.
- **390px**: header (back to Home, title **"Our little ones"** Shantell, Caveat sub-line **"all nine of them"**), a decorative room strip (CSS: wall `--sea-tint` with a window, a small plant and a `bed` doodle, floor band `--gelato-tint` with a rug; 120px tall; ambient: the window light slowly shifts), then the **stage** (selected pet), then the 3x3 **tile grid** (each tile 44px+ min height, actually ~96px: icon 56px, name, a tiny mood dot + word). The stage is sticky below the header? Not sticky; the stage is above the grid and the page scrolls normally. On first load select the first pet (Zizi); remember the last selected pet in `sessionStorage`.
- **1440px**: two columns: left (55%) the room scene with the nine pets standing on the floor at fixed positions (dogs on the floor, plushies on a shelf and a cushion); clicking a pet selects it; right (45%) the stage panel (`--surface` card) with the details, meters, actions and a "Recent" list.
- **Stage**: pet figure 160px (phone) / 200px (desktop) with idle animation (breathing: scaleY 1 -> 1.03, 3.2s; dogs wag: rotate +-3deg every 4s; Rorry shows its current face; plushies sit still with a slow sway), name (Shantell, 1.6rem), kind ("Dog" / "Plushie"), a mood line in Caveat, three meters, actions, "Last: Cj hugged Zoey · 2h ago".
- **Meters** (soft, never red/alarming): `Fullness` (icon `bowl`, fill `--citrus`), `Energy` (icon `bed`; high = energetic; fill `--sea`), `Joy` (small heart icons, fill `--gelato` with up to 5 tiny tomato hearts, hearts are allowed). Each is `role="meter"` with `aria-valuemin=0 aria-valuemax=100 aria-valuenow` and `aria-label="Zizi's fullness: pretty full"`; visible words instead of numbers: Fullness words (never "starving"): `peckish` (< 35) · `fine` (35-65) · `full` (66-100). Energy: `sleepy` (< 30) · `calm` (30-69) · `zoomies` (70+). Joy: `needs a cuddle` (< 40) · `content` (40-69) · `so happy` (70+). Bars animate to new values in 0.6s ease-out; reduced motion: instant.
- **Actions**: row of up to 4 `Button`s (secondary; none is tomato here, there is no primary): **Feed** (lucide `UtensilsCrossed`), **Play** (`Volleyball`), **Hug** (`Heart`), **Walk** (`Footprints`, dogs only; plushies have 3 buttons). Each >= 44px, labelled with icon + word. While an animation runs (about 1.4-2.4s) the buttons are `aria-busy` and disabled; double-taps are ignored. Tap -> `POST` fires immediately (optimistic: the animation starts at once; if the server returns `already_full`/`too_sleepy` the reaction switches to the gentle variant).
- **Reactions** (framer-motion, spring values from the landing: squash-and-stretch like Skyrie's bounce; `useReducedMotion()` -> no movement: a heart/sparkle fades in over the pet and the bubble shows for 1.6s):
  - **Feed**: a food doodle (random from `cookie`, `churro`, `fries`, `bowl` for dogs; for plushies a pretend `matcha`/`cookie`) arcs in (0.5s) to the pet's mouth; pet "chomps": `scaleY [1,.88,1,.9,1]`, `scaleX [1,1.08,1,1.06,1]` over 0.9s; 3 tiny crumbs; Caveat bubble from `["nom nom", "yum!", "more please?"]` (server picks the line). If already full (> 94): pet turns its head (flip rotate -6deg), bubble "not hungry right now, but thank you" and no stat change.
  - **Play**: a ball (CSS circle, `--sea`/`--citrus` stripes) bounces beside the pet (3 hops decaying, `easeOut`); the pet hops with squash and stretch `y [0,-34,0,-18,0,-8,0]`, `scaleY [1,1.1,.82,1.04,.9,1,1]`, 1.2s. Rorry: the flip (scaleX 1 -> 0 in 0.17s, swap teal grumpy/pink happy, 0.24s back). Skyrie: the big bounce (the exact landing keyframes, H = 90). Chimken: a long wiggle (`rotate [0,6,-6,4,0]`, with the body stretching `scaleX 1.1`). Junebug: a little roll (`rotate 0 -> 360`, 0.9s) with a bounce. If energy < 20: bubble "too sleepy to play, nap first?" and the pet curls (scale .95, `Zzz` text in Caveat floating up); suggest Hug (button pulse once).
  - **Hug**: pet squishes `scaleX [1,1.14,1.02,1.1,1]`, `scaleY [1,.88,1,.92,1]` (0.8s), two cheek blushes fade in, 4 hearts float up and fade (1.2s, staggered 120ms), bubble `["warm", "best hug", "again?"]`.
  - **Walk** (dogs): a leash line (SVG) appears; the dog trots left -> right across the stage (x from -40% to 40%, 2.2s, with a 0.25s hop cadence and a tiny dust puff) over a scrolling ground (parallax), sparkles at the end, bubble `["good walk", "sniff sniff", "that was fun"]`. Energy cost is higher; if energy < 20: "a bit tired for a walk, maybe a snack?".
  - After every reaction, meters update with the server response and the "Last:" line shows "You fed Zizi · just now".
- **Mood computed copy** (stage line, Caveat; one line chosen by priority): sleepy -> "Zizi is sleepy, a cuddle would be nice."; peckish -> "Zizi is a little peckish."; needs a cuddle -> "Zizi would love a hug."; otherwise happy -> "Zizi is having a good day."; all high -> "Zizi is so happy you're here." Never exclamation-heavy scolding.
- **Home widget** (`PetsWidget`): `--surface` card, title **"Our little ones"**, four pet faces (the four with the oldest `last_action_at`, i.e. the ones who've waited longest to be visited; each 44px, mood dot), one warm line from the same priority rules about the first of them ("Tato would love a snack."), `Button size="sm" variant="secondary"` "Visit". Loading: 4 round skeletons. Error: widget hidden silently (Home must not break). Empty (no pets, should not happen): hidden.
- **States**: loading (skeleton tiles + stage skeleton, pulse 1.4s), error (card "Couldn't reach the little ones." + Try again), success (toast not needed; the reaction is the feedback), cooldown (server 429): bubble "give Zizi a moment, love" and no toast, disabled (while another action is animating).
- Keyboard: tiles are a `role="radiogroup"` of `role="radio"` buttons (arrow keys move, Enter selects); action buttons are normal buttons; Enter/Space fire; focus stays on the pressed button after the reaction. Screen reader: reactions announced via `aria-live="polite"` text ("Zizi says: nom nom. Fullness is now full."). Decorative figure `aria-hidden`.
- Dark mode: room strip uses `--sea-tint`/`--gelato-tint` dark equivalents; figures use `--icon-ink`; a night window variant (stars) in dark; meters on `--surface-sunk`.
- Copy examples: empty "Recent": "Nobody has visited yet today." (never "ignored"). Header sub-line: "all nine of them". Cooldown: "give her a moment, love". Success after walk: "that was a good one".

### The decay curve (exact, so server and client agree)
State per pet (stored): `fullness_base`, `energy_base`, `joy_base` (0-100 integers) and `snapshot_at`. Current values at time `now`, with `dt` in hours since `snapshot_at`:
- `fullness(dt) = 20 + (fullness_base - 20) * 0.5^(dt / 8)`  (decays toward a floor of **20**, half-life 8 h; never reaches 0)
- `joy(dt)      = 30 + (joy_base - 30) * 0.5^(dt / 12)`      (floor **30**, half-life 12 h)
- `energy(dt)   = 100 - (100 - energy_base) * 0.5^(dt / 6)`   (recovers toward **100**, half-life 6 h: sleeping/resting is automatic)
Example: fed to 90 at 9:00 -> at 17:00 (dt 8h) fullness = 20 + 70*0.5 = 55 ("fine"); at 9:00 next day (dt 24h) = 20 + 70*0.125 = 28.75 ("peckish", still gentle).
Actions (applied to the CURRENT values, then the new snapshot is written with `snapshot_at = now`; values clamped 0-100):
| Action | fullness | energy | joy | Extra rule |
|---|---|---|---|---|
| feed | +35 | 0 | +8 | if fullness >= 95 -> reaction `already_full`, no changes |
| play | -4 | -22 | +18 | if energy < 20 -> reaction `too_sleepy`, no changes |
| hug | 0 | +2 | +25 | always allowed |
| walk (dogs) | -8 | -32 | +24 | if energy < 25 -> `too_sleepy` for walks |
Cooldown per pet per action: 8 seconds (server) to ignore double taps; returns `429` with a gentle message. Counters `fed_count`, `play_count`, `hug_count`, `walk_count` increase for fun ("fed 42 times", shown small in the stage as "42 snacks · 31 hugs").
Mood label priority (server also returns it): `sleepy` if energy < 30; else `peckish` if fullness < 35; else `needs_cuddle` if joy < 40; else `so_happy` if (joy >= 70 and fullness >= 50 and energy >= 40); else `content`.

## 3. Files to change / add
Frontend:
- ADD `fsp_frontend/src/pages/PetsPage.jsx` + `PetsPage.module.css`: room, stage, grid, recent line.
- ADD `fsp_frontend/src/components/pets/PetFigure/PetFigure.jsx` + `.module.css`: renders the right icon + collar + idle animation + reaction states (accepts `reaction` prop).
- ADD `fsp_frontend/src/components/pets/PetReactions/reactions.js`: framer-motion keyframes per action/pet (spring values above), reduced-motion variants.
- ADD `fsp_frontend/src/components/pets/PetStage/PetStage.jsx`, `PetMeters.jsx`, `PetTile.jsx`, `RoomScene.jsx`.
- ADD `fsp_frontend/src/components/home/PetsWidget/PetsWidget.jsx` + `.module.css`.
- ADD `fsp_frontend/src/constants/pets.js`: characters, collars, copy lines, thresholds, mood priority.
- ADD `fsp_frontend/src/services/petService.js`.
- CHANGE `queries/queryKeys.js` (`pets`), `queries/queries.js` (`usePets`: `staleTime 60s`, `refetchOnWindowFocus` true, no interval), `queries/mutations.js` (`usePetMutations().act(id, action)`: optimistic merge of the returned pet into the cache; no list invalidation).
- CHANGE `App.jsx` (route `/pets`), `pages/HomePage.jsx` + `.module.css` (widget).
- CHANGE `components/Icon/glyphs.jsx` only if a collar/tag helper or per-dog drawings are added (optional).
Backend:
- ADD `db/migration/V8__pets.sql` (table + 9 seed rows).
- ADD `entity/Pet.java`, `repository/PetRepository.java` (with `@Lock(PESSIMISTIC_WRITE) findById`), `dto/PetDTO.java`, `dto/request/PetActionRequest.java`, `dto/response/PetActionResponse.java`, `service/PetService.java` (pure `PetMath` helper class with the decay functions + unit-testable), `controller/PetController.java`.

## 4. Data
Flyway `V8__pets.sql`:
```sql
-- V8: the little ones. One small row per pet; stats are computed from the snapshot when read.
CREATE TABLE IF NOT EXISTS pets (
  id               varchar(16) PRIMARY KEY,                 -- 'zizi', 'junebug', ...
  name             varchar(24) NOT NULL,
  kind             varchar(5)  NOT NULL CHECK (kind IN ('dog','plush')),
  fullness_base    smallint    NOT NULL DEFAULT 70 CHECK (fullness_base BETWEEN 0 AND 100),
  energy_base      smallint    NOT NULL DEFAULT 80 CHECK (energy_base BETWEEN 0 AND 100),
  joy_base         smallint    NOT NULL DEFAULT 70 CHECK (joy_base BETWEEN 0 AND 100),
  snapshot_at      timestamptz NOT NULL DEFAULT now(),
  fed_count        integer     NOT NULL DEFAULT 0,
  play_count       integer     NOT NULL DEFAULT 0,
  hug_count        integer     NOT NULL DEFAULT 0,
  walk_count       integer     NOT NULL DEFAULT 0,
  last_action      varchar(5)  CHECK (last_action IN ('feed','play','hug','walk')),
  last_action_by   bigint,
  last_action_at   timestamptz,
  sort_order       smallint    NOT NULL DEFAULT 0
);
INSERT INTO pets (id, name, kind, sort_order) VALUES
  ('zizi','Zizi','dog',1), ('loafie','Loafie','dog',2), ('zoey','Zoey','dog',3),
  ('tato','Tato','dog',4), ('cooper','Cooper','dog',5),
  ('junebug','Junebug','plush',6), ('chimken','Chimken','plush',7),
  ('rorry','Rorry','plush',8), ('skyrie','Skyrie','plush',9)
ON CONFLICT (id) DO NOTHING;
```
Entity `Pet` (id String, plain fields, `OffsetDateTime`s). Optional DB-level cooldown can use `last_action_at` + an `action`-specific in-memory map; a simple per-pet-per-action 8s check against `last_action`/`last_action_at` is enough (only the latest action is stored).
**Storage**: ~110 bytes per pet row. Only 9 rows, forever (**~1 KB total; ~110 KB per 1,000 pets** if ever scaled). **Writes**: one UPDATE per tap; no scheduler, no per-minute writes; reads compute decay in memory (a few multiplications).

## 5. API
Base `/api/v1/pets`, `@PreAuthorize("isAuthenticated()")` (SecurityConfig already authenticates `/api/v1/**` by default).
- `GET /api/v1/pets` -> `200`
```json
{ "serverTime": "2026-10-25T10:00:00Z",
  "pets": [ { "id":"zizi","name":"Zizi","kind":"dog","stats":{"fullness":55,"energy":88,"joy":61},"mood":"content",
              "counts":{"feed":42,"play":18,"hug":31,"walk":9},
              "last":{"action":"hug","byUserId":3,"byName":"Cj","at":"2026-10-25T08:14:00Z"} } ] }
```
- `POST /api/v1/pets/{id}/actions` body `{ "action": "feed" }` -> `200`
```json
{ "pet": { "id":"zizi","name":"Zizi","kind":"dog","stats":{"fullness":90,"energy":88,"joy":69},"mood":"so_happy","counts":{"feed":43,"play":18,"hug":31,"walk":9},"last":{"action":"feed","byUserId":2,"byName":"Merylle","at":"2026-10-25T10:00:00Z"} },
  "reaction": { "kind": "ate", "line": "nom nom" } }
```
`reaction.kind` in `ate | already_full | played | too_sleepy | hugged | walked`; `line` is one of 3 allowed lines per kind (random server side). Errors: `400 {"success":false,"message":"Plushies don't go for walks."}` (walk on plush / unknown action), `404` unknown pet, `429 {"success":false,"message":"Give her a moment, love."}` (8s cooldown), `401`.
Concurrency: the service loads the row with `PESSIMISTIC_WRITE`, recomputes current values, applies the action, saves, so two simultaneous taps (both of us hugging Zoey) both count and neither overwrites the other.
Notifications: on `hug` only, `notifyOthers` with type `SYSTEM` ("Cj gave Zoey a hug"), at most one per pet per 30 minutes (skip if the previous `last_action = 'hug'` by the same user was < 30 min ago). No other notifications (no reminders, no nagging).

## 6. Edge cases and risks
- **Two users acting at once**: row lock above; the second request sees the first's snapshot and applies on top.
- **Clock skew / client time**: only server time is used for decay; the client shows server-returned values.
- **Old data / new deploy**: seeds are idempotent (`ON CONFLICT DO NOTHING`); `snapshot_at` defaults to deploy time so pets start at healthy values and never "starve" retroactively (floors make long absences gentle: after 3 days fullness is ~20, "peckish", joy ~30, "needs a cuddle").
- **Long absence**: copy stays kind; no penalty mechanic, no stats that reach 0, no sad faces beyond a soft blue-ish mouth; never show days-missed counters.
- **Spam taps**: client ignores taps during an animation; server 8s cooldown per pet+action.
- **Deleting / delete all**: pets are permanent characters (no delete). The three existing "delete all" actions do not touch them. If a user wants a reset, add `POST /api/v1/pets/reset` later (out of scope).
- **Drive / media**: not used (all drawings are icons + CSS).
- **Animation cost**: one pet animates at a time; room idle animations (breathing/wag) only for the selected pet; others static; pause on `document.hidden`.
- **No dependency**: framer-motion only.
- **Plushie "hunger"**: plushies don't really eat; the copy for plushies is playful ("Junebug pretends to nibble the cookie") with the same math so the UI stays consistent. Keep lines short and warm.
- **Guilt avoidance review**: grep the copy for "starving", "neglect", "sad", "ignored", "forgot", "miss" and remove; no push notifications, no streak badges.
- **Render**: tiny payloads (< 2 KB), 1 row update per action.

## 7. Acceptance checklist
- [ ] 390px: `/pets` shows header, stage, 3x3 grid without horizontal scroll; every tile and button >= 44px; thumb reach comfortable.
- [ ] Feed/Play/Hug (and Walk for dogs) each play a distinct reaction; plushies have no Walk; Rorry flips; Skyrie bounces with squash and stretch.
- [ ] Meters change per the table; "already full" and "too sleepy" show gentle variants and do not change stats.
- [ ] Partner sees updated stats and "Cj hugged Zoey · 2h ago" after refetch; two simultaneous hugs both count.
- [ ] After a simulated 3-day gap (edit `snapshot_at` in the DB) stats read "peckish / needs a cuddle", never 0.
- [ ] Home widget shows 4 faces and a warm line, links to `/pets`; widget failure does not break Home.
- [ ] Dark mode: room, stage, meters, figures readable.
- [ ] Keyboard-only: select a pet with arrows, trigger every action, focus stays logical; screen reader announces reaction text and meter values.
- [ ] Reduced motion: no hopping/walking; hearts/sparkles fade only; meters update instantly.
- [ ] No background jobs added; DB writes occur only on taps.
- [ ] Existing "delete all" actions unaffected.

## 8. Commit title
`Pets & babies: five dogs and four plushies with feed, play, hug and walk reactions and timestamp-based moods`

## 9. Prompt for Google AI Studio (self-contained)
Copy everything inside the block, paste it into AI Studio, then paste the files listed under "FILES I WILL PASTE BELOW".

``````text
You are a senior React + Spring Boot engineer and a UI/UX designer with an eye for cute, polished, playful detail.

## Brand & conventions (for sneakypea)

Values below were read from the code (`fsp_frontend/src/styles/design-tokens.css`, `components/ui/*`, `components/Icon/*`, `components/landing/LandingScene.jsx`, `constants/animations.js`). Anything marked **PLANNED** does not exist yet.

### Product
"for sneakypea" is a private scrapbook-style web app for ONE couple: Merylle ("Chicken", she/her doodle `her`) and Cj ("Junebug", he/him doodle `him`). Two normal users (role `ROLE_USER`) plus an admin (`ROLE_ADMIN`). Almost all data is **shared** between the two of them (tables are not filtered by user; rows carry `created_by`). Voice: warm, playful, lowercase-friendly, English with light Taglish ("love", "mahal", "Saan kakain?"). Never guilt-trip, never use shouty error copy. Interface chrome uses doodle icons (`Icon`) or Lucide line icons, not emoji.

### Stack
- **Frontend** `fsp_frontend`: React 19 + Vite 8, `react-router-dom` 7, `@tanstack/react-query` 5, `framer-motion` 12, `axios`, `lucide-react` (line icons), `html2canvas` (PNG export, lazy `import()`), Tailwind 4 (`@tailwindcss/vite`).
- **Styling split**: **CSS Modules + design tokens** for everything couple-facing (`components/ui`, `components/layout`, `pages/*.module.css`, landing, memories, profile). **Tailwind utilities** only in the Love Board (`components/loveBoard/**`, `styles/loveboard-tailwind.css`, class `lb-focus` for its focus ring) and Admin (`components/admin/**`, `styles/admin-tailwind.css`). New couple-facing features use CSS Modules + tokens. Never hard-code a hex that has a token; use `var(--token)`.
- **Data layer (frontend)**: `services/*.js` (axios calls on the shared `api` instance from `api/axiosConfig.js`, base path `/api/v1`) -> `queries/queries.js` (one `useXxx` hook per read, `useQuery` with a key from `queries/queryKeys.js`) -> `queries/mutations.js` (one `useXxxMutations()` hook per area; it wraps service functions with the internal `useAction` helper and invalidates families listed in `keyFamilies`). There is NO `mutations/` folder: it is the single file `queries/mutations.js`. Pages call `await xxxMutations.createThing(payload)` and handle errors themselves. Query client defaults: `staleTime 30s`, `gcTime 5min`, retry once for network/5xx only. Query keys are hierarchical arrays, e.g. `['folders', { includeArchived }]`, `['calendar', year, month]`, `['love-notes']`, `['profile']`, `['home','summary', today]`; a new feature adds its key to `queryKeys` and its prefix to `keyFamilies`.
- **Backend** `fsp_backend`: Spring Boot 3.4.2, Java 21, Lombok, Spring Security with JWT (stateless), Spring Data JPA (Hibernate `ddl-auto=validate`: **entities must match Flyway SQL exactly**), PostgreSQL (Supabase, transaction pooler), deployed on Render (512 MB RAM). Package `com.forsneakypea.fspbackend` with `controller/ dto/ entity/ repository/ service/ exception/ config/ security/`. Controllers use `@RequestMapping("/api/v1/<area>")`, `@PreAuthorize("isAuthenticated()")` and `getCurrentUserId()` (a `Long`). `SecurityConfig` ends with `anyRequest().authenticated()`, so new `/api/v1/**` routes are authenticated by default; only `/api/v1/auth/**` and signed `GET /api/v1/media/**` are public. IDs of new content tables are `UUID` (existing convention); users are `Long`. Errors: `BadRequestException` (400), `NotFoundException` / `ResourceNotFoundException` (404), `ValidationException` (400), `RateLimitExceededException` (429), handled by `GlobalExceptionHandler`. Activity + notifications: `activityLogService.log(userId, ACTION, RelatedEntityType, id)` and `notificationService.notifyOthers(userId, type, title, ...)` are called from services on create/update.
- **Flyway**: scripts in `fsp_backend/src/main/resources/db/migration/`. Existing: `V1__baseline.sql`, `V2__add_missing_indexes.sql`, `V3__drive_file_ids.sql`. **Next number is V4.** This roadmap assigns: V4 (commit 03), V5 (04), V6 (05), V7 (06), V8 (08). If commits are reordered or skipped, renumber consecutively. Use `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` as V3 does. The loose `.sql` files directly in `db/` are legacy and not run by Flyway.
- **Media (Google Drive, private)**: bytes never pass through our server. Flow: (1) `POST /api/v1/uploads/session {target, mimeType, size}` (target `memories | avatars | date-covers`; image/* only; max 15 MB, constant `MAX_BYTES` in `UploadService` and `MAX_UPLOAD_BYTES` in `api/driveUpload.js`) returns `{uploadUrl}`; (2) the browser `PUT`s the file to `uploadUrl` with a plain axios call (no app Authorization header, `withCredentials:false`); the response JSON has `id`; (3) the app saves that id as `driveFileId` through its normal API (e.g. `POST /memories/folders/{id}/photos {driveFileId, caption, location}`). `uploadImageToDrive(file, target, onProgress)` in `api/driveUpload.js` does steps 1-2 and reports progress 0..1. Reads: DTOs carry short-lived **signed** URLs `/api/v1/media/{fileId}?s=thumb|large&e=<expiry>&sig=<hmac>` (valid 1-2 h, rounded to the hour; sizes today: `thumb` 480 px, `large` 1600 px; `MediaUrlService.Size`). `GET /media/**` is public but needs a valid signature; responses are `Cache-Control: private, max-age=604800, immutable`. Never store image bytes or base64 in Postgres.

### Colour tokens (light, current; from `design-tokens.css`)
| Token | Hex | Use |
|---|---|---|
| `--ink` | `#172B70` | ALL text, outlines, offset shadows, doodle strokes |
| `--ink-soft` | `#3A4A73` | secondary text |
| `--ink-muted` | `#4A5A80` | meta text, captions |
| `--amalfi` | `#1F55C9` | links, footer, "Ready" |
| `--sea` | `#5CB3FF` | fills, default card shadow, "Dreaming" |
| `--citrus` | `#FF9F1C` | active nav, highlights, progress bars, "Booked" |
| `--gelato` | `#FFE680` | notes, date badges, "Planning" |
| `--tomato` | `#E0301A` | **primary buttons and hearts ONLY** |
| `--paper` | `#FFF8E8` | page background |
| `--white` | `#FFFFFF` | cards |
| `--sea-tint` | `#CDE7FF` | soft tile / hover fill |
| `--gelato-tint` | `#FFF0B3` | soft tile |
| `--citrus-tint` | `#FFD8A0` | soft tile |
| `--amalfi-tint` | `#CBDBF8` | soft tile |
| `--citrus-cover` | `#FFC76B` | album cover fill |
| `--line-soft` | `#C9D6EC` | dashed dividers |
| `--footer-ink` | `#E3EEFF` | text on the amalfi footer |
| `--paper-warm` | `#FFFDF6` | paper behind the Love Board room |
| `--sky-deep` / `--sky-pale` | `#8FC7F7` / `#CFE6F7` | sign-in sky gradient |
| `--sun-pale` / `--sun-peach` | `#FFEBC0` / `#FFD7A6` | sunrise gradient |
| `--user-accent`, `--user-accent-ink` | set at runtime from Profile accent (`ACCENT_COLORS` in `constants/profileOptions.js`: Peach `#FFD8A0`, Citrus `#FF9F1C`, Periwinkle `#CBDBF8`, Gelato `#FFE680`, Sea `#5CB3FF`, Amalfi `#1F55C9` with white ink) | avatar ring + active tab |

A block of **legacy aliases** (`--color-bg-main`, `--color-surface`, `--color-text-primary`, ... plus `--shadow-soft`, `--shadow-modal`) still exists at the bottom of `design-tokens.css` and is scheduled for deletion; do not use them in new code.

**Dark palette (PLANNED, defined in commit 03; commits 04-08 must already use tokens only so dark mode "just works").** Proposed values, to be verified at 4.5:1 by commit 03:
`--paper #0E1533` (night navy page) · `--white #19224D` (card surface) · `--ink #DCE5FF` (text, softened) · `--ink-soft #B4C2EE` · `--ink-muted #97A8DB` · `--line-soft #2E3C73` · borders/offset shadows use a new `--outline` token (light = `--ink`, dark = `#6F83CE`) and card shadow colour `--shadow-sea` (light `--sea`, dark `#2A4FA8`) · `--sea #5CB3FF` (unchanged) · `--sea-tint #1B3466` · `--citrus #FFAE3D` · `--citrus-tint #4A3A22` · `--gelato #FFE680` (unchanged; used as a "lit" colour) · `--gelato-tint #4A4420` · `--amalfi #8DB2FF` (links need to be lighter on navy) · `--amalfi-tint #22346B` · `--tomato #FF5A44` with navy text `#0E1533` on it (white on that tomato fails 4.5:1) · `--footer-ink #E3EEFF` · glow `--glow #FFD27A`. Paper/sticker/pin colours of the Love Board notes stay **light** (a lit sticky note on a dark board); only the wrapper is dark.

### Fonts (self-hosted via `@fontsource`, `styles/fonts.css`)
- `--font-heading` **Shantell Sans** (800 for titles): page titles, card titles, buttons, big numbers.
- `--font-body` **Nunito**: all body text, form fields, chips, nav labels. Body text is at least 16px on inputs (prevents iOS zoom).
- `--font-hand` **Caveat**: handwritten touches only: captions, sub-lines, signatures, notes-to-self. Never for paragraphs longer than ~2 lines or for form labels.
- Love Board letters offer 12 user-chosen content fonts (Patrick Hand default); that is user content, not UI.

### Shapes, borders, shadows, spacing
- Borders: `--border-width: 2px` solid `--ink` on every card, input, chip, button, modal.
- Radius scale: `--radius-input 14px` (inputs, buttons, chips-as-tiles), `--radius-card 24px` (cards), `--radius-card-lg 28px` (modals, big panels), album cards use 26px, `--radius-pill 999px` (chips, tabs, badges), avatars/stickers 50%.
- Offset shadows (flat, no blur): `--shadow-card: 6px 6px 0 var(--sea)`, `--shadow-card-citrus: 6px 6px 0 var(--citrus)`, `--shadow-button: 4px 4px 0 var(--ink)`. Hover lifts a card with `translate(-2px,-2px)` and shadow `8px 8px 0`; press moves a button `translate(2px,2px)` and shadow to `2px 2px 0`. Soft blur shadows are only for floating things (toasts, popovers, Love Board notes `drop-shadow(4px 5px 0 rgb(23 43 112 / .18))`).
- Spacing: there is no spacing token. Use a 4px base; the app's real gaps are 4, 8, 12, 14, 16, 24, 28, 40. Page gutter 16px on phones (`padding-inline: 16px`), content max width ~1100-1200px on desktop. Section rhythm 40px (phone) / 56-72px (desktop).
- Background texture: a dotted paper pattern `radial-gradient(circle, rgb(23 43 112 / .14) 1.4px, transparent 2px)` on page backgrounds; cards are plain `--white`.
- Breakpoints: **900px** (navbar pill becomes bottom `TabBar`, Home grids stack; `PHONE_NAV_QUERY` in `constants/nav.js`), **480px** (small-phone tweaks), 1024px (some wide layouts). Body gets class `has-tabbar` on phones (space for the bottom tab bar, ~72px).
- Nav items (`constants/nav.js`): Home `/home` (house), Memories `/memories` (camera), Dates `/dates` (motmot), Letters `/letters` (envelope). Pages: `/auth` (public landing + login), `/home`, `/memories`, `/dates`, `/letters` (Love Board), `/profile`, `/admin/*`. Unknown paths redirect to `/home`.

### Hard rules
1. **Tomato only for primary actions and hearts.** Nothing else is tomato (no tomato borders, errors use citrus badge + ink text).
2. **Text never sits directly on a busy pattern**: put it on a `--white`/`--paper` plate or sticker label with a 2px ink border.
3. **One sticker cluster per screen** (Home hero is the loud one). Other screens use at most 1-2 small `Icon`s.
4. **44px minimum tap targets** (`--tap: 44px`) on every button, chip, swatch, icon button, list row action.
5. **Focus ring**: `outline: var(--focus-ring)` (3px solid tomato) with `outline-offset: var(--focus-offset)` (2px) on `:focus-visible`; never remove an outline without replacing it. Love Board uses `lb-focus`.
6. **Every icon-only button has an `aria-label`** (use `IconButton` with required `label`). Decorative `Icon`s have no `label` (they become `aria-hidden`); meaningful ones pass `label`.
7. **Reduced motion**: every animation has a `@media (prefers-reduced-motion: reduce)` branch (CSS) or `useReducedMotion()` branch (framer-motion) that turns movement off (instant state change or a short opacity crossfade <= 150ms). Auto-looping animation stops completely.
8. **Phone first**: design at 360-430px (verify at 390px), no horizontal page scroll, full-width modals (`Modal`) for phone pickers; a bottom-sheet placement does NOT exist yet, so use `size="md"` centered or `placement="right"` and let CSS make it full-width on phones, safe-area padding for fixed bottom UI (`env(safe-area-inset-bottom)`), body text >= 16px in inputs.
9. Status is never conveyed by colour alone (icon or label too). Toasts use `role="status"`; errors `role="alert"`.
10. Destructive actions use `ConfirmDialog danger`; wiping a whole area uses `DeleteAllDialog` (type "delete all"). Every new area that stores user content must be wiped by the matching "delete all" (backend `BulkDeleteService`: `DELETE /api/v1/love-board/all`, `/memories/all`, `/dates/all`; the confirm UI lives in `MemoriesPage`, `DatesPage`, `LoveLettersPage/BoardMenu`).

### Shared components (import these; do not make one-off controls)
All in `fsp_frontend/src/components/...`. Each is a default export unless noted.
- `ui/Button/Button.jsx`: `<Button variant="primary|secondary|ghost|danger" size="md|sm" type="button" loading disabled className {...rest}>`; `primary` is the tomato one (use once per view).
- `ui/IconButton/IconButton.jsx`: `<IconButton label="Close" variant size="md|sm" type {...rest}>{icon}</IconButton>`; `label` becomes `aria-label` (required).
- `ui/Modal/Modal.jsx`: `<Modal open onClose title ariaLabel size="md" placement="center|right" (right = slide-over drawer; sizes sm|md|lg|xl) locked role="dialog|alertdialog" hideClose footer className bodyClassName>`; traps focus, locks scroll, Escape closes unless `locked`; either `title` (renders heading, labels dialog) or `ariaLabel`.
- `ui/ConfirmDialog/ConfirmDialog.jsx`: `<ConfirmDialog open title message confirmLabel="Confirm" cancelLabel="Cancel" busyLabel="Working…" busy danger error icon="bell" onConfirm onClose>{children}</ConfirmDialog>`.
- `ui/DeleteAllDialog/DeleteAllDialog.jsx`: `<DeleteAllDialog open what busy error onConfirm onClose />`; named export `DELETE_ALL_PHRASE = 'delete all'`.
- `ui/Field/Field.jsx`: `<Field label hint error required htmlFor className>{control}</Field>`; wrap every input/select. Control classes live in `ui/FormControls.module.css` (`input`, `select`, `textarea`).
- `ui/Select/Select.jsx` (forwardRef): `<Select options={[{value,label}]} placeholder>` or `<option>` children; a real `<select>` underneath.
- `ui/DatePicker/DatePicker.jsx`: named exports `DatePicker` (default) and `TimePicker`; native inputs with brand shell + icon.
- `ui/Chip/Chip.jsx`: `<Chip active radio type>`; pill toggle/filter; `radio` for single-select semantics.
- `ui/Tabs/Tabs.jsx`: `<Tabs label tabs value onChange idPrefix />` + named `TabPanel({idPrefix,id,active,children})`, helpers `tabId`, `panelId` (roving tabindex, arrow keys).
- `ui/RadioGroup/RadioGroup.jsx`: `<RadioGroup label value onChange options disabled variant="tile|swatch" />`; named export `ColorSwatchGroup({label,value,onChange,colors:[{value,name,color?}],disabled})` (accessible name = colour NAME, never hex).
- `ui/StatusChip/StatusChip.jsx`: `<StatusChip status />` for date statuses.
- `Icon/Icon.jsx` (+ `Icon/index.js` exports `ICON_NAMES`): `<Icon name size=24 sticker tilt label className style />`. 64x64 viewBox, ink stroke `#172B70` width 2.6, round caps/joins, flat fills from the palette. `sticker` = white circle + ink border + offset shadow (big happy moments only). Icon names (GLYPHS in `Icon/glyphs.jsx`): `motmot camera film star tulip daisy mic car rc dog plush ball chimken rorry mountain museum yogurt fries churro matcha cookie lasagna pizza donut bowl envelope house heart jorts bell sparkle vinyl cassette videocam meme tree wheel pin utensils bed claw plane arena lechon ferris sun her him ticket`. Meanings worth knowing: `plush` = Junebug the avocado, `ball` = Skyrie (bear-head plush with rainbow beanie), `chimken` = Chimken, `rorry` = reversible octopus (`RORRY_BODY` path exported), `her` = Merylle/Chicken, `him` = Cj/Junebug, `motmot` = their red car. **`glyphs.jsx` is hand-edited: never regenerate it from `docs/rebrand/Icon.dc.html`.** Adding an icon = add a key to `GLYPHS`, it appears in `ICON_NAMES` automatically; `/dev/icons` (`dev/IconCheck.jsx`) previews all.
- Toasts: `const { addToast } = useNotification()` (`hooks/useNotification.js`); `addToast(message, type = 'info' | 'success' | 'gold' | 'error', duration = 4000)`. Rendered by `common/Notification/Notification.jsx` (stack, icon per type, dismiss button).
- `common/PageLoader/PageLoader.jsx` (bouncing loader for page-level loading), `common/ErrorBoundary/ErrorBoundary.jsx` (wraps routes; "snag" screen), `admin/common/LoadingSkeleton.jsx` + `EmptyState.jsx` exist for admin only.
- Hooks: `useMediaQuery(query)`, `useIsMobile()`, `useScrollLock(locked)`, `useAuth()` (`{user, logout}`), `useCanvasDrag` (Love Board drag).
- Layout: `layout/Navbar/Navbar.jsx` (desktop pill + avatar menu on phones), `layout/TabBar/TabBar.jsx` (phone bottom nav), `layout/Footer/Footer.jsx`, `layout/Logo/Logo.jsx`.

### Animation style (copy the landing page's feel)
Soft springs, gentle bounces, squash-and-stretch, and pointer-only parallax. Real values in the code:
- Shared easings: `[0.16, 1, 0.3, 1]` (expo-out; `fadeIn` 0.3s, `slideUp` 0.4s `y:24`, `scaleIn` 0.3s from `0.92`, `pageTransition` 0.35s `y:12`, `staggerContainer` `staggerChildren .08, delayChildren .1`) and `[0.22, 1, 0.36, 1]` (Auth hero 0.6s, form 0.4s). Pages enter with `opacity 0->1, y 15->0, 0.4s`. Presets are in `constants/animations.js`.
- Springs: `hoverScale` = `{type:'spring', stiffness:400, damping:25}` with `whileHover {scale:1.025,y:-2}` / `whileTap {scale:.975}`; Love Board note `{300, 22}` (hover scale 1.03, drag 1.06); sticker `{380, 18}` (bouncy); toolbar `{260, 24}`; panels/drawers `{340, 34}`; sidebar `{300, 32}`; active-tab indicator `{400, 32}`; Love Board layer panel `{320, 32}`.
- Landing parallax: `useSpring(mouseX, {stiffness: 55, damping: 18})`, only when a fine pointer exists (never on touch).
- Skyrie big bounce (squash and stretch, 1.6s `easeOut`, keyframe `times [0, .3, .44, .62, .76, .9, 1]`): `y [0, -H, 0, -.43H, 0, -.15H, 0]` (H 150 desktop / 100 phone), `scaleY [1, 1.1, .68, 1.05, .84, 1.02, 1]`, `scaleX [1, .92, 1.26, .97, 1.12, .99, 1]`.
- Rorry flip: `scaleX 1->0` with `y:-16` in 0.17s `easeIn`, swap face, `scaleX 0->1` in 0.24s `easeOut`.
- Motmot drive: `x` travel `easeInOut` 2.8s desktop / 2.2s phone and back. Clouds drift linearly 30-44s loops (`--duration`, `--delay` CSS vars). `PageLoader` bounce `1.1s ease-in-out infinite`. Skeleton pulse `1.4s` opacity 1 <-> .6.
- Rules of thumb for new motion: enter 250-450ms with expo-out; interactions 120-200ms; celebratory moments 0.8-1.6s with squash-and-stretch; spring stiffness 260-400 / damping 18-34 (lower damping = bouncier, use <= 22 only for tiny playful things); stagger lists at 60-80ms per item (cap total at 800ms); nothing loops forever except ambient background drift; `useReducedMotion()` -> no transforms, opacity only.
- Toast motion: `initial {opacity:0,y:20,scale:.95}` -> `animate {1,0,1}`, exit `{0,-20,.9}`.

### Existing behaviours new work must not break
Drive private media (signed URLs, `driveFileId`), the three "delete all" flows, notifications to the partner (`notifyOthers`), activity log, Calendar Dump PNG export (`html2canvas`, background `#FFF8E8`, scale >= 3), Love Board note/sticker canvas (sticker `image` convention `icon:<name>`, paper `paper:<id>`), per-user accent (`--user-accent`), JWT auth + `ProtectedRoute`, query invalidation via `keyFamilies`.

# FEATURE SPEC (08 · Pets & babies (dogs and plushies we look after together))

## 1. Goal and user flow
A calm, cuddly corner of the app: nine "babies" we both look after. Five dogs (Zizi, Loafie, Zoey, Tato, Cooper) and four plushies (Junebug the avocado, Chimken the long hotdog-shaped avocado, Rorry the reversible octopus, Skyrie the bear-head plush with a rainbow beanie). We can feed, play, hug and (dogs only) walk them. Each action plays a cute reaction. Mood, hunger and energy are **computed from timestamps** when read, stored in **one small row per pet**, with no background jobs and no per-minute writes. Both of us see the same pets. Copy is always gentle: no guilt, no "neglected", no streaks.

**Flow (phone).** Home -> small "Our little ones" widget (4 pet faces + one warm line) -> tap -> `/pets` (the pet room) -> tap a pet tile -> the stage shows that pet big, its three soft meters (full tummy, energy, joy) and action buttons -> tap **Feed** -> food flies in, pet chomps, a Caveat bubble says "nom nom" -> meters ease up -> tap **Hug** -> squish + hearts -> back to the room. The partner's actions show up as a line ("Cj hugged Zoey · 2h ago") the next time we look.

## 2. UX spec

### Characters (`constants/pets.js`, the single source for names, kinds and looks)
| id | Name | Kind | Icon today | Notes |
|---|---|---|---|---|
| `zizi` | Zizi | dog | `dog` | |
| `loafie` | Loafie | dog | `dog` | |
| `zoey` | Zoey | dog | `dog` | |
| `tato` | Tato | dog | `dog` | |
| `cooper` | Cooper | dog | `dog` | |
| `junebug` | Junebug | plush | `plush` | avocado |
| `chimken` | Chimken | plush | `chimken` | long hotdog-shaped avocado |
| `rorry` | Rorry | plush | `rorry` | reversible octopus (teal grumpy <-> pink happy); `RORRY_BODY` path is exported from `glyphs.jsx` |
| `skyrie` | Skyrie | plush | `ball` | bear-head plush, rainbow beanie |
The kit has ONE `dog` doodle. To tell five dogs apart without new drawings, each dog gets a **collar** (small SVG band + round tag in a palette colour: Zizi `sea`, Loafie `citrus`, Zoey `gelato`, Tato `amalfi`, Cooper `white`) drawn over the dog, a name tag under the figure, and an optional `coat` tint overlay (`mix-blend-mode: multiply` with a pale tint) driven by `constants/pets.js`; a TODO comment lets Chicken/Junebug later swap in real per-dog drawings (`dogZizi`, ...) by changing the `icon` field. Do not invent specific real-life coat colours; defaults are neutral.

### Pet room (`/pets`)
- Route `/pets` (protected, `ROLE_USER`), lazy-loaded. Entry points: the Home widget, and optionally a link in the Profile page. Not in the 4-item nav.
- **390px**: header (back to Home, title **"Our little ones"** Shantell, Caveat sub-line **"all nine of them"**), a decorative room strip (CSS: wall `--sea-tint` with a window, a small plant and a `bed` doodle, floor band `--gelato-tint` with a rug; 120px tall; ambient: the window light slowly shifts), then the **stage** (selected pet), then the 3x3 **tile grid** (each tile 44px+ min height, actually ~96px: icon 56px, name, a tiny mood dot + word). The stage is sticky below the header? Not sticky; the stage is above the grid and the page scrolls normally. On first load select the first pet (Zizi); remember the last selected pet in `sessionStorage`.
- **1440px**: two columns: left (55%) the room scene with the nine pets standing on the floor at fixed positions (dogs on the floor, plushies on a shelf and a cushion); clicking a pet selects it; right (45%) the stage panel (`--surface` card) with the details, meters, actions and a "Recent" list.
- **Stage**: pet figure 160px (phone) / 200px (desktop) with idle animation (breathing: scaleY 1 -> 1.03, 3.2s; dogs wag: rotate +-3deg every 4s; Rorry shows its current face; plushies sit still with a slow sway), name (Shantell, 1.6rem), kind ("Dog" / "Plushie"), a mood line in Caveat, three meters, actions, "Last: Cj hugged Zoey · 2h ago".
- **Meters** (soft, never red/alarming): `Fullness` (icon `bowl`, fill `--citrus`), `Energy` (icon `bed`; high = energetic; fill `--sea`), `Joy` (small heart icons, fill `--gelato` with up to 5 tiny tomato hearts, hearts are allowed). Each is `role="meter"` with `aria-valuemin=0 aria-valuemax=100 aria-valuenow` and `aria-label="Zizi's fullness: pretty full"`; visible words instead of numbers: Fullness words (never "starving"): `peckish` (< 35) · `fine` (35-65) · `full` (66-100). Energy: `sleepy` (< 30) · `calm` (30-69) · `zoomies` (70+). Joy: `needs a cuddle` (< 40) · `content` (40-69) · `so happy` (70+). Bars animate to new values in 0.6s ease-out; reduced motion: instant.
- **Actions**: row of up to 4 `Button`s (secondary; none is tomato here, there is no primary): **Feed** (lucide `UtensilsCrossed`), **Play** (`Volleyball`), **Hug** (`Heart`), **Walk** (`Footprints`, dogs only; plushies have 3 buttons). Each >= 44px, labelled with icon + word. While an animation runs (about 1.4-2.4s) the buttons are `aria-busy` and disabled; double-taps are ignored. Tap -> `POST` fires immediately (optimistic: the animation starts at once; if the server returns `already_full`/`too_sleepy` the reaction switches to the gentle variant).
- **Reactions** (framer-motion, spring values from the landing: squash-and-stretch like Skyrie's bounce; `useReducedMotion()` -> no movement: a heart/sparkle fades in over the pet and the bubble shows for 1.6s):
  - **Feed**: a food doodle (random from `cookie`, `churro`, `fries`, `bowl` for dogs; for plushies a pretend `matcha`/`cookie`) arcs in (0.5s) to the pet's mouth; pet "chomps": `scaleY [1,.88,1,.9,1]`, `scaleX [1,1.08,1,1.06,1]` over 0.9s; 3 tiny crumbs; Caveat bubble from `["nom nom", "yum!", "more please?"]` (server picks the line). If already full (> 94): pet turns its head (flip rotate -6deg), bubble "not hungry right now, but thank you" and no stat change.
  - **Play**: a ball (CSS circle, `--sea`/`--citrus` stripes) bounces beside the pet (3 hops decaying, `easeOut`); the pet hops with squash and stretch `y [0,-34,0,-18,0,-8,0]`, `scaleY [1,1.1,.82,1.04,.9,1,1]`, 1.2s. Rorry: the flip (scaleX 1 -> 0 in 0.17s, swap teal grumpy/pink happy, 0.24s back). Skyrie: the big bounce (the exact landing keyframes, H = 90). Chimken: a long wiggle (`rotate [0,6,-6,4,0]`, with the body stretching `scaleX 1.1`). Junebug: a little roll (`rotate 0 -> 360`, 0.9s) with a bounce. If energy < 20: bubble "too sleepy to play, nap first?" and the pet curls (scale .95, `Zzz` text in Caveat floating up); suggest Hug (button pulse once).
  - **Hug**: pet squishes `scaleX [1,1.14,1.02,1.1,1]`, `scaleY [1,.88,1,.92,1]` (0.8s), two cheek blushes fade in, 4 hearts float up and fade (1.2s, staggered 120ms), bubble `["warm", "best hug", "again?"]`.
  - **Walk** (dogs): a leash line (SVG) appears; the dog trots left -> right across the stage (x from -40% to 40%, 2.2s, with a 0.25s hop cadence and a tiny dust puff) over a scrolling ground (parallax), sparkles at the end, bubble `["good walk", "sniff sniff", "that was fun"]`. Energy cost is higher; if energy < 20: "a bit tired for a walk, maybe a snack?".
  - After every reaction, meters update with the server response and the "Last:" line shows "You fed Zizi · just now".
- **Mood computed copy** (stage line, Caveat; one line chosen by priority): sleepy -> "Zizi is sleepy, a cuddle would be nice."; peckish -> "Zizi is a little peckish."; needs a cuddle -> "Zizi would love a hug."; otherwise happy -> "Zizi is having a good day."; all high -> "Zizi is so happy you're here." Never exclamation-heavy scolding.
- **Home widget** (`PetsWidget`): `--surface` card, title **"Our little ones"**, four pet faces (the four with the oldest `last_action_at`, i.e. the ones who've waited longest to be visited; each 44px, mood dot), one warm line from the same priority rules about the first of them ("Tato would love a snack."), `Button size="sm" variant="secondary"` "Visit". Loading: 4 round skeletons. Error: widget hidden silently (Home must not break). Empty (no pets, should not happen): hidden.
- **States**: loading (skeleton tiles + stage skeleton, pulse 1.4s), error (card "Couldn't reach the little ones." + Try again), success (toast not needed; the reaction is the feedback), cooldown (server 429): bubble "give Zizi a moment, love" and no toast, disabled (while another action is animating).
- Keyboard: tiles are a `role="radiogroup"` of `role="radio"` buttons (arrow keys move, Enter selects); action buttons are normal buttons; Enter/Space fire; focus stays on the pressed button after the reaction. Screen reader: reactions announced via `aria-live="polite"` text ("Zizi says: nom nom. Fullness is now full."). Decorative figure `aria-hidden`.
- Dark mode: room strip uses `--sea-tint`/`--gelato-tint` dark equivalents; figures use `--icon-ink`; a night window variant (stars) in dark; meters on `--surface-sunk`.
- Copy examples: empty "Recent": "Nobody has visited yet today." (never "ignored"). Header sub-line: "all nine of them". Cooldown: "give her a moment, love". Success after walk: "that was a good one".

### The decay curve (exact, so server and client agree)
State per pet (stored): `fullness_base`, `energy_base`, `joy_base` (0-100 integers) and `snapshot_at`. Current values at time `now`, with `dt` in hours since `snapshot_at`:
- `fullness(dt) = 20 + (fullness_base - 20) * 0.5^(dt / 8)`  (decays toward a floor of **20**, half-life 8 h; never reaches 0)
- `joy(dt)      = 30 + (joy_base - 30) * 0.5^(dt / 12)`      (floor **30**, half-life 12 h)
- `energy(dt)   = 100 - (100 - energy_base) * 0.5^(dt / 6)`   (recovers toward **100**, half-life 6 h: sleeping/resting is automatic)
Example: fed to 90 at 9:00 -> at 17:00 (dt 8h) fullness = 20 + 70*0.5 = 55 ("fine"); at 9:00 next day (dt 24h) = 20 + 70*0.125 = 28.75 ("peckish", still gentle).
Actions (applied to the CURRENT values, then the new snapshot is written with `snapshot_at = now`; values clamped 0-100):
| Action | fullness | energy | joy | Extra rule |
|---|---|---|---|---|
| feed | +35 | 0 | +8 | if fullness >= 95 -> reaction `already_full`, no changes |
| play | -4 | -22 | +18 | if energy < 20 -> reaction `too_sleepy`, no changes |
| hug | 0 | +2 | +25 | always allowed |
| walk (dogs) | -8 | -32 | +24 | if energy < 25 -> `too_sleepy` for walks |
Cooldown per pet per action: 8 seconds (server) to ignore double taps; returns `429` with a gentle message. Counters `fed_count`, `play_count`, `hug_count`, `walk_count` increase for fun ("fed 42 times", shown small in the stage as "42 snacks · 31 hugs").
Mood label priority (server also returns it): `sleepy` if energy < 30; else `peckish` if fullness < 35; else `needs_cuddle` if joy < 40; else `so_happy` if (joy >= 70 and fullness >= 50 and energy >= 40); else `content`.

## 3. Files to change / add
Frontend:
- ADD `fsp_frontend/src/pages/PetsPage.jsx` + `PetsPage.module.css`: room, stage, grid, recent line.
- ADD `fsp_frontend/src/components/pets/PetFigure/PetFigure.jsx` + `.module.css`: renders the right icon + collar + idle animation + reaction states (accepts `reaction` prop).
- ADD `fsp_frontend/src/components/pets/PetReactions/reactions.js`: framer-motion keyframes per action/pet (spring values above), reduced-motion variants.
- ADD `fsp_frontend/src/components/pets/PetStage/PetStage.jsx`, `PetMeters.jsx`, `PetTile.jsx`, `RoomScene.jsx`.
- ADD `fsp_frontend/src/components/home/PetsWidget/PetsWidget.jsx` + `.module.css`.
- ADD `fsp_frontend/src/constants/pets.js`: characters, collars, copy lines, thresholds, mood priority.
- ADD `fsp_frontend/src/services/petService.js`.
- CHANGE `queries/queryKeys.js` (`pets`), `queries/queries.js` (`usePets`: `staleTime 60s`, `refetchOnWindowFocus` true, no interval), `queries/mutations.js` (`usePetMutations().act(id, action)`: optimistic merge of the returned pet into the cache; no list invalidation).
- CHANGE `App.jsx` (route `/pets`), `pages/HomePage.jsx` + `.module.css` (widget).
- CHANGE `components/Icon/glyphs.jsx` only if a collar/tag helper or per-dog drawings are added (optional).
Backend:
- ADD `db/migration/V8__pets.sql` (table + 9 seed rows).
- ADD `entity/Pet.java`, `repository/PetRepository.java` (with `@Lock(PESSIMISTIC_WRITE) findById`), `dto/PetDTO.java`, `dto/request/PetActionRequest.java`, `dto/response/PetActionResponse.java`, `service/PetService.java` (pure `PetMath` helper class with the decay functions + unit-testable), `controller/PetController.java`.

## 4. Data
Flyway `V8__pets.sql`:
```sql
-- V8: the little ones. One small row per pet; stats are computed from the snapshot when read.
CREATE TABLE IF NOT EXISTS pets (
  id               varchar(16) PRIMARY KEY,                 -- 'zizi', 'junebug', ...
  name             varchar(24) NOT NULL,
  kind             varchar(5)  NOT NULL CHECK (kind IN ('dog','plush')),
  fullness_base    smallint    NOT NULL DEFAULT 70 CHECK (fullness_base BETWEEN 0 AND 100),
  energy_base      smallint    NOT NULL DEFAULT 80 CHECK (energy_base BETWEEN 0 AND 100),
  joy_base         smallint    NOT NULL DEFAULT 70 CHECK (joy_base BETWEEN 0 AND 100),
  snapshot_at      timestamptz NOT NULL DEFAULT now(),
  fed_count        integer     NOT NULL DEFAULT 0,
  play_count       integer     NOT NULL DEFAULT 0,
  hug_count        integer     NOT NULL DEFAULT 0,
  walk_count       integer     NOT NULL DEFAULT 0,
  last_action      varchar(5)  CHECK (last_action IN ('feed','play','hug','walk')),
  last_action_by   bigint,
  last_action_at   timestamptz,
  sort_order       smallint    NOT NULL DEFAULT 0
);
INSERT INTO pets (id, name, kind, sort_order) VALUES
  ('zizi','Zizi','dog',1), ('loafie','Loafie','dog',2), ('zoey','Zoey','dog',3),
  ('tato','Tato','dog',4), ('cooper','Cooper','dog',5),
  ('junebug','Junebug','plush',6), ('chimken','Chimken','plush',7),
  ('rorry','Rorry','plush',8), ('skyrie','Skyrie','plush',9)
ON CONFLICT (id) DO NOTHING;
```
Entity `Pet` (id String, plain fields, `OffsetDateTime`s). Optional DB-level cooldown can use `last_action_at` + an `action`-specific in-memory map; a simple per-pet-per-action 8s check against `last_action`/`last_action_at` is enough (only the latest action is stored).
**Storage**: ~110 bytes per pet row. Only 9 rows, forever (**~1 KB total; ~110 KB per 1,000 pets** if ever scaled). **Writes**: one UPDATE per tap; no scheduler, no per-minute writes; reads compute decay in memory (a few multiplications).

## 5. API
Base `/api/v1/pets`, `@PreAuthorize("isAuthenticated()")` (SecurityConfig already authenticates `/api/v1/**` by default).
- `GET /api/v1/pets` -> `200`
```json
{ "serverTime": "2026-10-25T10:00:00Z",
  "pets": [ { "id":"zizi","name":"Zizi","kind":"dog","stats":{"fullness":55,"energy":88,"joy":61},"mood":"content",
              "counts":{"feed":42,"play":18,"hug":31,"walk":9},
              "last":{"action":"hug","byUserId":3,"byName":"Cj","at":"2026-10-25T08:14:00Z"} } ] }
```
- `POST /api/v1/pets/{id}/actions` body `{ "action": "feed" }` -> `200`
```json
{ "pet": { "id":"zizi","name":"Zizi","kind":"dog","stats":{"fullness":90,"energy":88,"joy":69},"mood":"so_happy","counts":{"feed":43,"play":18,"hug":31,"walk":9},"last":{"action":"feed","byUserId":2,"byName":"Merylle","at":"2026-10-25T10:00:00Z"} },
  "reaction": { "kind": "ate", "line": "nom nom" } }
```
`reaction.kind` in `ate | already_full | played | too_sleepy | hugged | walked`; `line` is one of 3 allowed lines per kind (random server side). Errors: `400 {"success":false,"message":"Plushies don't go for walks."}` (walk on plush / unknown action), `404` unknown pet, `429 {"success":false,"message":"Give her a moment, love."}` (8s cooldown), `401`.
Concurrency: the service loads the row with `PESSIMISTIC_WRITE`, recomputes current values, applies the action, saves, so two simultaneous taps (both of us hugging Zoey) both count and neither overwrites the other.
Notifications: on `hug` only, `notifyOthers` with type `SYSTEM` ("Cj gave Zoey a hug"), at most one per pet per 30 minutes (skip if the previous `last_action = 'hug'` by the same user was < 30 min ago). No other notifications (no reminders, no nagging).

## 6. Edge cases and risks
- **Two users acting at once**: row lock above; the second request sees the first's snapshot and applies on top.
- **Clock skew / client time**: only server time is used for decay; the client shows server-returned values.
- **Old data / new deploy**: seeds are idempotent (`ON CONFLICT DO NOTHING`); `snapshot_at` defaults to deploy time so pets start at healthy values and never "starve" retroactively (floors make long absences gentle: after 3 days fullness is ~20, "peckish", joy ~30, "needs a cuddle").
- **Long absence**: copy stays kind; no penalty mechanic, no stats that reach 0, no sad faces beyond a soft blue-ish mouth; never show days-missed counters.
- **Spam taps**: client ignores taps during an animation; server 8s cooldown per pet+action.
- **Deleting / delete all**: pets are permanent characters (no delete). The three existing "delete all" actions do not touch them. If a user wants a reset, add `POST /api/v1/pets/reset` later (out of scope).
- **Drive / media**: not used (all drawings are icons + CSS).
- **Animation cost**: one pet animates at a time; room idle animations (breathing/wag) only for the selected pet; others static; pause on `document.hidden`.
- **No dependency**: framer-motion only.
- **Plushie "hunger"**: plushies don't really eat; the copy for plushies is playful ("Junebug pretends to nibble the cookie") with the same math so the UI stays consistent. Keep lines short and warm.
- **Guilt avoidance review**: grep the copy for "starving", "neglect", "sad", "ignored", "forgot", "miss" and remove; no push notifications, no streak badges.
- **Render**: tiny payloads (< 2 KB), 1 row update per action.

## 7. Acceptance checklist
- [ ] 390px: `/pets` shows header, stage, 3x3 grid without horizontal scroll; every tile and button >= 44px; thumb reach comfortable.
- [ ] Feed/Play/Hug (and Walk for dogs) each play a distinct reaction; plushies have no Walk; Rorry flips; Skyrie bounces with squash and stretch.
- [ ] Meters change per the table; "already full" and "too sleepy" show gentle variants and do not change stats.
- [ ] Partner sees updated stats and "Cj hugged Zoey · 2h ago" after refetch; two simultaneous hugs both count.
- [ ] After a simulated 3-day gap (edit `snapshot_at` in the DB) stats read "peckish / needs a cuddle", never 0.
- [ ] Home widget shows 4 faces and a warm line, links to `/pets`; widget failure does not break Home.
- [ ] Dark mode: room, stage, meters, figures readable.
- [ ] Keyboard-only: select a pet with arrows, trigger every action, focus stays logical; screen reader announces reaction text and meter values.
- [ ] Reduced motion: no hopping/walking; hearts/sparkles fade only; meters update instantly.
- [ ] No background jobs added; DB writes occur only on taps.
- [ ] Existing "delete all" actions unaffected.

# FILES I WILL PASTE BELOW
Frontend (shared, to reuse):
- fsp_frontend/src/components/ui/Button/Button.jsx and Button.module.css
- fsp_frontend/src/components/ui/IconButton/IconButton.jsx and IconButton.module.css
- fsp_frontend/src/components/ui/Modal/Modal.jsx
- fsp_frontend/src/components/ui/RadioGroup/RadioGroup.jsx and RadioGroup.module.css
- fsp_frontend/src/components/Icon/Icon.jsx and glyphs.jsx (paste whole files; notice `RORRY_BODY`)
- fsp_frontend/src/components/landing/LandingScene.jsx (reference for the Skyrie bounce and Rorry flip keyframes; paste the animation section)
- fsp_frontend/src/constants/animations.js
- fsp_frontend/src/hooks/useMediaQuery.js and useNotification.js
- fsp_frontend/src/styles/design-tokens.css
Frontend (related, to change):
- fsp_frontend/src/App.jsx
- fsp_frontend/src/pages/HomePage.jsx and HomePage.module.css
- fsp_frontend/src/queries/queryKeys.js
- fsp_frontend/src/queries/queries.js
- fsp_frontend/src/queries/mutations.js
- fsp_frontend/src/services/homeService.js (service style reference)
Backend (reference + to change):
- fsp_backend/src/main/resources/db/migration/V3__drive_file_ids.sql (style) and V5__menu_items.sql (from commit 04)
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/controller/MenuController.java, service/MenuService.java, entity/MenuItem.java, repository/MenuItemRepository.java (from commit 04, style reference)
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/service/NotificationService.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/entity/NotificationType.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/security/CurrentUser.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/exception/GlobalExceptionHandler.java and RateLimitExceededException.java

# OUTPUT RULES
- Return COMPLETE file contents for every changed or new file. Each file goes in its own code block, with the full repo path as the heading directly above the block (for example "### fsp_frontend/src/pages/WheelPage.jsx"). Never use "...", "// rest unchanged", or placeholders; if a file is long, still return all of it.
- Reuse the shared components and tokens from the Brand & conventions block instead of creating one-off styles or controls. Use CSS Modules + tokens for couple-facing UI.
- Do not add any npm or Maven dependency unless the spec names it. Do not rename or remove existing exports other code may use.
- Keep all existing behavior working (Drive media, notifications, "delete all" flows, Calendar PNG export, Love Board, auth).
- Backend: Flyway SQL files must be exactly the versions named in the spec; entities must match the SQL because Hibernate runs with ddl-auto=validate.
- Honor reduced motion, dark-mode tokens, 44px tap targets, focus rings and aria-labels everywhere.
- End your answer with a short test list (what to click or try at 390px, in dark mode, with keyboard, and with reduced motion).

# QUALITY BAR
Match or exceed the current app's polish: thoughtful spacing, delightful but calm motion, perfect on a phone.
``````
