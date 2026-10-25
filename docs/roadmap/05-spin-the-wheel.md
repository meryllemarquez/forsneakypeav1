# 05 · Spin the wheel ("Saan kakain?", "Saan pupunta?")

## 1. Goal and user flow
A decision wheel for the two of us: make named wheels with 2-12 choices, spin with a satisfying animation, get a cute result card, keep saved wheels and a small history. Choices can be added quickly from the "Our usual orders" menu (commit 04).

**Flow (phone).** Home -> "Spin the wheel" card (uses the existing `wheel` doodle) -> `/wheel` -> first time: empty state with two starters ("Saan kakain?" prefilled from our menu, "Saan pupunta?" blank) -> tap a wheel chip -> big wheel + "Spin" button -> wheel whirls, the pointer ticks, it slows, wobbles and stops -> doodle confetti -> result card "Saan kakain? -> Lasagna!" -> "Spin again" or "Let's go" (marks it chosen, toast, closes). Editing: "Edit choices" expands an inline editor under the wheel; changes autosave. From the Usual Orders menu: a "Spin it" button, and each food has "Add to a wheel".

## 2. UX spec

### Navigation
- New route `/wheel` (protected, `ROLE_USER`) lazy-loaded in `App.jsx`. NOT added to the four-item `NAV_ITEMS`/TabBar (a fifth tab would crowd 360px phones). Entry points: (1) a Home card **"Can't decide?"** + Caveat **"spin the wheel, love"** with the `wheel` doodle (plain icon size 64, no sticker); (2) a "Spin it" `Button size="sm"` in the menu sheet toolbar; (3) a link in the Dates page empty state ("Not sure where to go? Spin for it"). Page title (browser tab) "Spin the wheel".

### Wheel page layout
- **390px** (single column): header row (back chevron to Home as `IconButton label="Back to Home"`, title "Spin the wheel" Shantell, `Button size="sm" variant="secondary"` "New wheel"); wheel chips row (horizontal scroll, snap, each `Chip radio`, the active one with ink fill; fades at edges; last chip "+ New"); the wheel (diameter `min(88vw, 340px)` centered, pointer on top as a small tomato-free pointer: pointer is **ink + gelato** (tomato is not allowed), 28px wide); the primary **"Spin!"** `Button variant="primary"` full width, 56px tall below the wheel; a collapsible "Edit choices" section (`<details>`-style with a real button, `aria-expanded`); a collapsible "Recent spins" list (last 8).
- **1440px**: two columns; left (55%) the wheel at 440px with Spin button beneath; right (45%) a `--surface` card with the editor on top and history under it. Wheel chips become a vertical list at the top of the right column when there are more than 4 wheels.
- Wheel look: SVG, 2px `--outline` between segments, ink outer ring (6px) with 12 tiny studs, centre hub (circle r=22) with a small `sparkle` doodle, segment labels in Shantell 800 on the segment (text on solid segment colour only, never on patterns): label colour `--ink` on light segments, `#FFFFFF` on `amalfi` segments. Segment colours cycle from the palette so adjacent segments differ.
- **Colours for segments (tomato is NOT allowed here):** keys `sea #5CB3FF`, `citrus #FF9F1C`, `gelato #FFE680`, `amalfi #1F55C9`, `sea-tint #CDE7FF`, `citrus-tint #FFD8A0`, `gelato-tint #FFF0B3`, `amalfi-tint #CBDBF8`. Default auto-assignment walks `[sea, citrus, gelato, amalfi, sea-tint, citrus-tint, gelato-tint, amalfi-tint]` skipping the previous segment's colour (and the first segment's colour for the last). In dark mode (commit 03) the segment colours stay (they are vivid enough on navy) and the ring uses `--outline`.
- Long labels: up to 40 chars stored; on the wheel truncated to 12 chars (ellipsis) at 7+ segments and 16 chars at <= 6 (full text always appears on the result card and in the list). Optional per-choice doodle (food/places) drawn small near the rim.

### Choice editor (inline)
- Each choice row: a 28px colour dot button (opens that row's `ColorSwatchGroup` inline under the row with the 8 palette colours; accessible names "Sea", "Citrus"…), a text `Field`-less input (the label is `aria-label="Choice 3"`; max 40; placeholder "Where to?"), an optional doodle button (opens a `RadioGroup` tile grid of ~16 relevant doodles) and a remove `IconButton label="Remove <label>"`.
- Bottom row: input "Add a choice…" (Enter adds; focus stays for rapid entry) + `Button size="sm"` "Add". At 12: input disabled, hint **"12 is the max, love."** At 2: remove buttons disabled, hint **"A wheel needs at least 2."**
- Duplicate labels allowed (warning chip "same as #2" but not blocked). Empty labels are not saved (row shows `Field error` "Give it a name").
- Wheel name `input` (max 40) at the top of the editor; `Button variant="ghost"` "Delete wheel" (ConfirmDialog danger: "Delete 'Saan kakain?'", "Its spin history goes too.").
- Autosave: debounce 700ms after the last change; status text next to the title: "Saving…" / "Saved" / "Couldn't save · Retry" (`aria-live="polite"`). Wheel redraws live as you type (no animation except a 150ms colour/size ease).
- Quick add from Usual Orders: in the menu sheet each food has a "Spin for it" action (adds that food to the currently selected wheel, or opens a small `Modal` "Add to which wheel?" with `RadioGroup` of wheels) -> toast "Added lasagna to Saan kakain?". The first time the user creates "Saan kakain?" the editor offers **"Fill from our usual orders"** (button) that adds up to 12 menu foods with their doodles and loved-by colours.

### Spinning (the feel)
- The result is decided BEFORE the animation: `crypto.getRandomValues` picks the winning index with equal probability (optional per-choice weight is out of scope). The landing angle is random inside the winning segment but kept 15% away from the segment edges so the pointer never lands on a line.
- Rotation: total = current rotation + `5 to 8` full turns (random) + offset to the target angle. Duration **4.6s** (+ 0.2s per extra turn, max 5.4s). Easing: `cubic-bezier(0.12, 0.72, 0.12, 1)` (fast start, long graceful slow-down). Implementation: framer-motion `animate(rotate, target, {duration, ease: [0.12,0.72,0.12,1]})` on a `useMotionValue`; the Spin button first does a 120ms anticipation: wheel rotates back **-8deg** with spring `{stiffness: 300, damping: 22}`, button squashes (`scaleX 1.06, scaleY .92`).
- **Ticking pointer**: subscribe to the rotation motion value; each time the angle crosses a segment boundary under the pointer, the pointer flicks: `rotate -22deg` instantly then spring back to 0 `{stiffness: 600, damping: 18}`. Optional tiny haptic `navigator.vibrate?.(6)` (when available and not reduced-motion). Sound is OFF by default; a small `IconButton` speaker toggle (lucide `Volume2/VolumeX`, `aria-pressed`, remembered in localStorage `fsp-wheel-sound`) plays a 20ms WebAudio click per tick (generated with an `OscillatorNode`, no audio files, no dependency). Ticks are rate-limited to 1 per 40ms.
- **End wobble**: once the main rotation completes, a settle: `rotate: [0, +2.5, -1.2, +0.5, 0]` deg relative, 0.55s `easeOut`; the winning segment pulses (`scale 1.04`, outline thickens 3px -> 2px) once; the hub `sparkle` does a quick 360 spin.
- **Doodle confetti**: 28 small `Icon`s (random from `star sparkle heart tulip daisy` + the winning choice's doodle x4; hearts are allowed here because it is a love moment but only 4 of them) burst from the hub: each with random angle, speed 220-420px, rotation +-180deg, scale .6-1, lifetime 1.4s with gravity (y += 260px), fade last 30%. One `motion.div` layer with `pointer-events: none`, `aria-hidden`. Cleaned up after 1.6s.
- **Result card** (after 350ms): a centered `Modal`-based card (`size="sm"`, no close X, `ariaLabel="Result"`), slides/pops in with spring `{stiffness: 380, damping: 18}` (scale .8 -> 1, rotate -2 -> 0): sticker doodle 96px (winning choice doodle or `wheel`), small Caveat line **"Saan kakain? gets…"**, big Shantell result text (wraps), then buttons: `Button variant="secondary"` **"Spin again"** (closes the card and spins immediately), `Button variant="primary"` **"Let's go"** (saves `accepted`, toast `success` "Enjoy, love.", closes).
- **Reduced motion**: no rotation animation; the pointer simply jumps: the wheel snaps to the result angle instantly, the winning segment highlights, no confetti, no wobble, card fades in (150ms), no ticking pointer. Vibration/sound still follow their own toggles.
- Disabled/other states: Spin disabled while spinning (label "Spinning…") and when the wheel has < 2 valid choices (hint "Add at least 2 choices"). Loading: skeleton circle (pulse). Error loading wheels: card "Couldn't load your wheels." + Try again. Empty: starters as above. Success: result card.
- Keyboard: Space/Enter on Spin; standard Tab order, no custom shortcuts; the wheel SVG is `role="img"` with an `aria-label` listing choices ("Wheel Saan kakain? with 6 choices: …"); the result is announced via an `aria-live="assertive"` region ("Result: Lasagna") and by focusing the card heading.

### History
- "Recent spins" list (last 8 per wheel, newest first): `Icon` (choice doodle), label, relative time ("2 days ago"), who spun (her/him doodle 22px), and a check badge when "Let's go" was pressed (accessible text "went with it"). `Button size="sm" variant="ghost"` "Clear history" (ConfirmDialog). Empty: "No spins yet. Go on, spin it."

## 3. Files to change / add
Frontend:
- ADD `fsp_frontend/src/pages/WheelPage.jsx` + `WheelPage.module.css`: page layout, chips, editor + history panels.
- ADD `fsp_frontend/src/components/wheel/SpinWheel/SpinWheel.jsx` + `.module.css`: SVG wheel, spin logic, pointer ticking, confetti.
- ADD `fsp_frontend/src/components/wheel/ChoiceEditor/ChoiceEditor.jsx` + `.module.css`: inline editor with autosave.
- ADD `fsp_frontend/src/components/wheel/ResultCard/ResultCard.jsx`: result modal.
- ADD `fsp_frontend/src/components/wheel/SpinHistory/SpinHistory.jsx`.
- ADD `fsp_frontend/src/components/home/WheelCard/WheelCard.jsx` (Home entry).
- ADD `fsp_frontend/src/constants/wheelOptions.js`: palette keys -> CSS vars, defaults, limits, starters.
- ADD `fsp_frontend/src/utils/wheelMath.js`: segment geometry, winning-angle picker (`crypto.getRandomValues`), tick detection; keep pure and unit-testable.
- ADD `fsp_frontend/src/services/wheelService.js`.
- CHANGE `fsp_frontend/src/queries/queryKeys.js` (`wheels`, `wheelSpins(id)`), `queries/queries.js` (`useWheels`, `useWheelSpins`), `queries/mutations.js` (`useWheelMutations`).
- CHANGE `fsp_frontend/src/App.jsx`: lazy route `/wheel`.
- CHANGE `fsp_frontend/src/pages/HomePage.jsx` + `.module.css`: WheelCard.
- CHANGE `fsp_frontend/src/components/home/MenuBook/MenuBook.jsx` (from commit 04): "Spin it" + "Add to a wheel".
- CHANGE `fsp_frontend/src/pages/DatesPage.jsx`: small empty-state link (optional).
Backend:
- ADD `db/migration/V6__wheels.sql`.
- ADD `entity/Wheel.java`, `entity/WheelSpin.java`, `repository/WheelRepository.java`, `repository/WheelSpinRepository.java`, `dto/WheelDTO.java`, `dto/WheelSpinDTO.java`, `dto/request/WheelRequest.java`, `dto/request/WheelSpinRequest.java`, `service/WheelService.java`, `controller/WheelController.java`.

## 4. Data
Flyway `V6__wheels.sql`:
```sql
-- V6: decision wheels and their spin history. Choices are a small JSON array (no table per choice).
CREATE TABLE IF NOT EXISTS wheels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        varchar(40) NOT NULL,
  choices     jsonb       NOT NULL DEFAULT '[]'::jsonb,   -- [{ "id":"a1b2c3d4", "label":"Lasagna", "color":"sea", "doodle":"lasagna" }]
  version     bigint      NOT NULL DEFAULT 0,
  created_by  bigint,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wheels_choices_array CHECK (jsonb_typeof(choices) = 'array' AND jsonb_array_length(choices) BETWEEN 2 AND 12)
);
CREATE TABLE IF NOT EXISTS wheel_spins (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wheel_id     uuid        NOT NULL REFERENCES wheels(id) ON DELETE CASCADE,
  choice_id    varchar(16) NOT NULL,
  label        varchar(40) NOT NULL,       -- copied, so history survives edits/removals
  doodle       varchar(24),
  accepted     boolean     NOT NULL DEFAULT false,
  spun_by      bigint,
  spun_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wheel_spins_wheel_time ON wheel_spins (wheel_id, spun_at DESC);
```
JPA: `Wheel.choices` mapped with `@JdbcTypeCode(SqlTypes.JSON)` to `List<WheelChoice>` (record `id,label,color,doodle`) or to `String` with Jackson in the service (Hibernate 6 supports JSON mapping; keep `ddl-auto=validate` happy by declaring `columnDefinition = "jsonb"`). `@Version Long version`.
Server validation: 2-12 choices, label 1-40 chars, `color` in the 8 allowed keys, `doodle` in the icon allow-list or null, unique choice ids. The wheel table CHECK is a safety net (note: wheels can't be saved in an in-between 1-choice state; the editor keeps local drafts and autosaves only valid states).
History pruning: after each insert keep only the newest 30 spins per wheel (`DELETE ... WHERE wheel_id = ? AND id NOT IN (SELECT id ... ORDER BY spun_at DESC LIMIT 30)`).
**Storage**: wheel ~ (name 20 + 12 choices x 70 bytes) ~ 0.9 KB; spin row ~ 90 bytes. **~1 KB per wheel; ~1 MB per 1,000 wheels.** History worst case 30 x 90 B = 2.7 KB per wheel (**~2.7 MB per 1,000 wheels**).

## 5. API
All `@PreAuthorize("isAuthenticated()")`, base `/api/v1/wheels`.
- `GET /api/v1/wheels` -> `200 [ { "id":"…","name":"Saan kakain?","choices":[{"id":"a1b2c3d4","label":"Lasagna","color":"sea","doodle":"lasagna"}, …],"version":2,"updatedAt":"…" } ]` (newest-updated first, max 50).
- `POST /api/v1/wheels` `{ "name":"Saan pupunta?", "choices":[{"id":"x1","label":"Baguio","color":"citrus","doodle":null},{"id":"x2","label":"Tagaytay","color":"sea"}] }` -> `201` wheel. `400 {"success":false,"message":"A wheel needs 2 to 12 choices."}`.
- `PUT /api/v1/wheels/{id}` `{ "name":"…","choices":[…],"version":2 }` -> `200` wheel (version 3). `409 {"success":false,"message":"This wheel was just changed by someone else."}`; `404`.
- `DELETE /api/v1/wheels/{id}` -> `204` (spins cascade).
- `POST /api/v1/wheels/{id}/spins` `{ "choiceId":"a1b2c3d4" }` (server copies label/doodle from the CURRENT wheel; `400` if choice not found) -> `201 { "id":"…","label":"Lasagna","doodle":"lasagna","accepted":false,"spunBy":3,"spunAt":"…" }`.
- `PATCH /api/v1/wheels/spins/{spinId}` `{ "accepted": true }` -> `200`.
- `GET /api/v1/wheels/{id}/spins?limit=8` -> `200 [ … ]`; `DELETE /api/v1/wheels/{id}/spins` -> `204` (clear history).
No notification on spin (it is in-the-moment); `notifyOthers` (type `SYSTEM`, no related entity) only when a wheel is created ("Cj made a new wheel: Saan pupunta?").

## 6. Edge cases and risks
- **Two people editing the same wheel**: `version` conflict -> 409 -> editor shows "Cj changed this wheel. Load their version?" (keeps the local draft until chosen). Autosave never overwrites silently.
- **Spinning while the partner edits**: the spin uses the local snapshot; the server stores the label copy, so history stays right even if the choice vanished (POST uses `choiceId` and falls back to a `label` sent by the client if the choice no longer exists, flagged accordingly).
- **Deleting a wheel mid-spin**: result is still shown; saving the spin returns 404 -> result card shows normally, toast "That wheel was deleted, so this spin wasn't saved."
- **Old data**: new tables only. Wheels referencing a doodle that is later removed from the kit render without a doodle (never crash).
- **Fairness/exploits**: client-side randomness is fine (a couple's app). Use `crypto.getRandomValues` with rejection sampling to avoid modulo bias.
- **Performance**: SVG with <= 12 segments; rotation by CSS transform on a single `g` (GPU); confetti limited to 28 elements; ticks rate-limited; pause everything when `document.hidden`.
- **Audio**: WebAudio contexts must start after a user gesture (the Spin tap); fail silently if unavailable.
- **JSON column + `validate`**: use the exact type mapping above and test app start against a real Postgres.
- **Render**: tiny payloads; no background jobs.
- **Delete all**: existing "delete all" actions (memories, dates, love board) do not touch wheels; wheel deletion and per-wheel "Clear history" are the only wipes. If product later wants a global wipe, add `DELETE /api/v1/wheels/all` to `BulkDeleteService`.

## 7. Acceptance checklist
- [ ] 390px: wheel fits without horizontal scroll, Spin button >= 56px, chips scroll horizontally only inside their row, editor usable one-handed.
- [ ] Spin lands exactly under the pointer (verify with 2, 3, 7 and 12 choices; result label equals the segment under the pointer).
- [ ] Pointer ticks per segment; wobble at the end; confetti then result card; "Spin again" re-spins; "Let's go" saves and toasts.
- [ ] Reduced motion: instant result, no confetti/wobble.
- [ ] Create, edit inline (add, remove, recolour, rename, doodle), autosave status works; limits 2 and 12 enforced.
- [ ] Quick add from the Usual Orders menu works; "Fill from our usual orders" works.
- [ ] History shows newest 8, who spun, accepted badge; clear history works; partner sees the same wheels.
- [ ] Dark mode: wheel, ring, chips, editor, result card readable; segment labels keep contrast (ink on light, white on amalfi).
- [ ] Keyboard-only: create wheel, edit, spin, dismiss result; screen reader hears the result.
- [ ] Existing "delete all" actions still work and leave wheels intact.

## 8. Commit title
`Spin the wheel: saved decision wheels with ticking spin, doodle confetti, result card and history`

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

# FEATURE SPEC (05 · Spin the wheel ("Saan kakain?", "Saan pupunta?"))

## 1. Goal and user flow
A decision wheel for the two of us: make named wheels with 2-12 choices, spin with a satisfying animation, get a cute result card, keep saved wheels and a small history. Choices can be added quickly from the "Our usual orders" menu (commit 04).

**Flow (phone).** Home -> "Spin the wheel" card (uses the existing `wheel` doodle) -> `/wheel` -> first time: empty state with two starters ("Saan kakain?" prefilled from our menu, "Saan pupunta?" blank) -> tap a wheel chip -> big wheel + "Spin" button -> wheel whirls, the pointer ticks, it slows, wobbles and stops -> doodle confetti -> result card "Saan kakain? -> Lasagna!" -> "Spin again" or "Let's go" (marks it chosen, toast, closes). Editing: "Edit choices" expands an inline editor under the wheel; changes autosave. From the Usual Orders menu: a "Spin it" button, and each food has "Add to a wheel".

## 2. UX spec

### Navigation
- New route `/wheel` (protected, `ROLE_USER`) lazy-loaded in `App.jsx`. NOT added to the four-item `NAV_ITEMS`/TabBar (a fifth tab would crowd 360px phones). Entry points: (1) a Home card **"Can't decide?"** + Caveat **"spin the wheel, love"** with the `wheel` doodle (plain icon size 64, no sticker); (2) a "Spin it" `Button size="sm"` in the menu sheet toolbar; (3) a link in the Dates page empty state ("Not sure where to go? Spin for it"). Page title (browser tab) "Spin the wheel".

### Wheel page layout
- **390px** (single column): header row (back chevron to Home as `IconButton label="Back to Home"`, title "Spin the wheel" Shantell, `Button size="sm" variant="secondary"` "New wheel"); wheel chips row (horizontal scroll, snap, each `Chip radio`, the active one with ink fill; fades at edges; last chip "+ New"); the wheel (diameter `min(88vw, 340px)` centered, pointer on top as a small tomato-free pointer: pointer is **ink + gelato** (tomato is not allowed), 28px wide); the primary **"Spin!"** `Button variant="primary"` full width, 56px tall below the wheel; a collapsible "Edit choices" section (`<details>`-style with a real button, `aria-expanded`); a collapsible "Recent spins" list (last 8).
- **1440px**: two columns; left (55%) the wheel at 440px with Spin button beneath; right (45%) a `--surface` card with the editor on top and history under it. Wheel chips become a vertical list at the top of the right column when there are more than 4 wheels.
- Wheel look: SVG, 2px `--outline` between segments, ink outer ring (6px) with 12 tiny studs, centre hub (circle r=22) with a small `sparkle` doodle, segment labels in Shantell 800 on the segment (text on solid segment colour only, never on patterns): label colour `--ink` on light segments, `#FFFFFF` on `amalfi` segments. Segment colours cycle from the palette so adjacent segments differ.
- **Colours for segments (tomato is NOT allowed here):** keys `sea #5CB3FF`, `citrus #FF9F1C`, `gelato #FFE680`, `amalfi #1F55C9`, `sea-tint #CDE7FF`, `citrus-tint #FFD8A0`, `gelato-tint #FFF0B3`, `amalfi-tint #CBDBF8`. Default auto-assignment walks `[sea, citrus, gelato, amalfi, sea-tint, citrus-tint, gelato-tint, amalfi-tint]` skipping the previous segment's colour (and the first segment's colour for the last). In dark mode (commit 03) the segment colours stay (they are vivid enough on navy) and the ring uses `--outline`.
- Long labels: up to 40 chars stored; on the wheel truncated to 12 chars (ellipsis) at 7+ segments and 16 chars at <= 6 (full text always appears on the result card and in the list). Optional per-choice doodle (food/places) drawn small near the rim.

### Choice editor (inline)
- Each choice row: a 28px colour dot button (opens that row's `ColorSwatchGroup` inline under the row with the 8 palette colours; accessible names "Sea", "Citrus"…), a text `Field`-less input (the label is `aria-label="Choice 3"`; max 40; placeholder "Where to?"), an optional doodle button (opens a `RadioGroup` tile grid of ~16 relevant doodles) and a remove `IconButton label="Remove <label>"`.
- Bottom row: input "Add a choice…" (Enter adds; focus stays for rapid entry) + `Button size="sm"` "Add". At 12: input disabled, hint **"12 is the max, love."** At 2: remove buttons disabled, hint **"A wheel needs at least 2."**
- Duplicate labels allowed (warning chip "same as #2" but not blocked). Empty labels are not saved (row shows `Field error` "Give it a name").
- Wheel name `input` (max 40) at the top of the editor; `Button variant="ghost"` "Delete wheel" (ConfirmDialog danger: "Delete 'Saan kakain?'", "Its spin history goes too.").
- Autosave: debounce 700ms after the last change; status text next to the title: "Saving…" / "Saved" / "Couldn't save · Retry" (`aria-live="polite"`). Wheel redraws live as you type (no animation except a 150ms colour/size ease).
- Quick add from Usual Orders: in the menu sheet each food has a "Spin for it" action (adds that food to the currently selected wheel, or opens a small `Modal` "Add to which wheel?" with `RadioGroup` of wheels) -> toast "Added lasagna to Saan kakain?". The first time the user creates "Saan kakain?" the editor offers **"Fill from our usual orders"** (button) that adds up to 12 menu foods with their doodles and loved-by colours.

### Spinning (the feel)
- The result is decided BEFORE the animation: `crypto.getRandomValues` picks the winning index with equal probability (optional per-choice weight is out of scope). The landing angle is random inside the winning segment but kept 15% away from the segment edges so the pointer never lands on a line.
- Rotation: total = current rotation + `5 to 8` full turns (random) + offset to the target angle. Duration **4.6s** (+ 0.2s per extra turn, max 5.4s). Easing: `cubic-bezier(0.12, 0.72, 0.12, 1)` (fast start, long graceful slow-down). Implementation: framer-motion `animate(rotate, target, {duration, ease: [0.12,0.72,0.12,1]})` on a `useMotionValue`; the Spin button first does a 120ms anticipation: wheel rotates back **-8deg** with spring `{stiffness: 300, damping: 22}`, button squashes (`scaleX 1.06, scaleY .92`).
- **Ticking pointer**: subscribe to the rotation motion value; each time the angle crosses a segment boundary under the pointer, the pointer flicks: `rotate -22deg` instantly then spring back to 0 `{stiffness: 600, damping: 18}`. Optional tiny haptic `navigator.vibrate?.(6)` (when available and not reduced-motion). Sound is OFF by default; a small `IconButton` speaker toggle (lucide `Volume2/VolumeX`, `aria-pressed`, remembered in localStorage `fsp-wheel-sound`) plays a 20ms WebAudio click per tick (generated with an `OscillatorNode`, no audio files, no dependency). Ticks are rate-limited to 1 per 40ms.
- **End wobble**: once the main rotation completes, a settle: `rotate: [0, +2.5, -1.2, +0.5, 0]` deg relative, 0.55s `easeOut`; the winning segment pulses (`scale 1.04`, outline thickens 3px -> 2px) once; the hub `sparkle` does a quick 360 spin.
- **Doodle confetti**: 28 small `Icon`s (random from `star sparkle heart tulip daisy` + the winning choice's doodle x4; hearts are allowed here because it is a love moment but only 4 of them) burst from the hub: each with random angle, speed 220-420px, rotation +-180deg, scale .6-1, lifetime 1.4s with gravity (y += 260px), fade last 30%. One `motion.div` layer with `pointer-events: none`, `aria-hidden`. Cleaned up after 1.6s.
- **Result card** (after 350ms): a centered `Modal`-based card (`size="sm"`, no close X, `ariaLabel="Result"`), slides/pops in with spring `{stiffness: 380, damping: 18}` (scale .8 -> 1, rotate -2 -> 0): sticker doodle 96px (winning choice doodle or `wheel`), small Caveat line **"Saan kakain? gets…"**, big Shantell result text (wraps), then buttons: `Button variant="secondary"` **"Spin again"** (closes the card and spins immediately), `Button variant="primary"` **"Let's go"** (saves `accepted`, toast `success` "Enjoy, love.", closes).
- **Reduced motion**: no rotation animation; the pointer simply jumps: the wheel snaps to the result angle instantly, the winning segment highlights, no confetti, no wobble, card fades in (150ms), no ticking pointer. Vibration/sound still follow their own toggles.
- Disabled/other states: Spin disabled while spinning (label "Spinning…") and when the wheel has < 2 valid choices (hint "Add at least 2 choices"). Loading: skeleton circle (pulse). Error loading wheels: card "Couldn't load your wheels." + Try again. Empty: starters as above. Success: result card.
- Keyboard: Space/Enter on Spin; standard Tab order, no custom shortcuts; the wheel SVG is `role="img"` with an `aria-label` listing choices ("Wheel Saan kakain? with 6 choices: …"); the result is announced via an `aria-live="assertive"` region ("Result: Lasagna") and by focusing the card heading.

### History
- "Recent spins" list (last 8 per wheel, newest first): `Icon` (choice doodle), label, relative time ("2 days ago"), who spun (her/him doodle 22px), and a check badge when "Let's go" was pressed (accessible text "went with it"). `Button size="sm" variant="ghost"` "Clear history" (ConfirmDialog). Empty: "No spins yet. Go on, spin it."

## 3. Files to change / add
Frontend:
- ADD `fsp_frontend/src/pages/WheelPage.jsx` + `WheelPage.module.css`: page layout, chips, editor + history panels.
- ADD `fsp_frontend/src/components/wheel/SpinWheel/SpinWheel.jsx` + `.module.css`: SVG wheel, spin logic, pointer ticking, confetti.
- ADD `fsp_frontend/src/components/wheel/ChoiceEditor/ChoiceEditor.jsx` + `.module.css`: inline editor with autosave.
- ADD `fsp_frontend/src/components/wheel/ResultCard/ResultCard.jsx`: result modal.
- ADD `fsp_frontend/src/components/wheel/SpinHistory/SpinHistory.jsx`.
- ADD `fsp_frontend/src/components/home/WheelCard/WheelCard.jsx` (Home entry).
- ADD `fsp_frontend/src/constants/wheelOptions.js`: palette keys -> CSS vars, defaults, limits, starters.
- ADD `fsp_frontend/src/utils/wheelMath.js`: segment geometry, winning-angle picker (`crypto.getRandomValues`), tick detection; keep pure and unit-testable.
- ADD `fsp_frontend/src/services/wheelService.js`.
- CHANGE `fsp_frontend/src/queries/queryKeys.js` (`wheels`, `wheelSpins(id)`), `queries/queries.js` (`useWheels`, `useWheelSpins`), `queries/mutations.js` (`useWheelMutations`).
- CHANGE `fsp_frontend/src/App.jsx`: lazy route `/wheel`.
- CHANGE `fsp_frontend/src/pages/HomePage.jsx` + `.module.css`: WheelCard.
- CHANGE `fsp_frontend/src/components/home/MenuBook/MenuBook.jsx` (from commit 04): "Spin it" + "Add to a wheel".
- CHANGE `fsp_frontend/src/pages/DatesPage.jsx`: small empty-state link (optional).
Backend:
- ADD `db/migration/V6__wheels.sql`.
- ADD `entity/Wheel.java`, `entity/WheelSpin.java`, `repository/WheelRepository.java`, `repository/WheelSpinRepository.java`, `dto/WheelDTO.java`, `dto/WheelSpinDTO.java`, `dto/request/WheelRequest.java`, `dto/request/WheelSpinRequest.java`, `service/WheelService.java`, `controller/WheelController.java`.

## 4. Data
Flyway `V6__wheels.sql`:
```sql
-- V6: decision wheels and their spin history. Choices are a small JSON array (no table per choice).
CREATE TABLE IF NOT EXISTS wheels (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        varchar(40) NOT NULL,
  choices     jsonb       NOT NULL DEFAULT '[]'::jsonb,   -- [{ "id":"a1b2c3d4", "label":"Lasagna", "color":"sea", "doodle":"lasagna" }]
  version     bigint      NOT NULL DEFAULT 0,
  created_by  bigint,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT wheels_choices_array CHECK (jsonb_typeof(choices) = 'array' AND jsonb_array_length(choices) BETWEEN 2 AND 12)
);
CREATE TABLE IF NOT EXISTS wheel_spins (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wheel_id     uuid        NOT NULL REFERENCES wheels(id) ON DELETE CASCADE,
  choice_id    varchar(16) NOT NULL,
  label        varchar(40) NOT NULL,       -- copied, so history survives edits/removals
  doodle       varchar(24),
  accepted     boolean     NOT NULL DEFAULT false,
  spun_by      bigint,
  spun_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wheel_spins_wheel_time ON wheel_spins (wheel_id, spun_at DESC);
```
JPA: `Wheel.choices` mapped with `@JdbcTypeCode(SqlTypes.JSON)` to `List<WheelChoice>` (record `id,label,color,doodle`) or to `String` with Jackson in the service (Hibernate 6 supports JSON mapping; keep `ddl-auto=validate` happy by declaring `columnDefinition = "jsonb"`). `@Version Long version`.
Server validation: 2-12 choices, label 1-40 chars, `color` in the 8 allowed keys, `doodle` in the icon allow-list or null, unique choice ids. The wheel table CHECK is a safety net (note: wheels can't be saved in an in-between 1-choice state; the editor keeps local drafts and autosaves only valid states).
History pruning: after each insert keep only the newest 30 spins per wheel (`DELETE ... WHERE wheel_id = ? AND id NOT IN (SELECT id ... ORDER BY spun_at DESC LIMIT 30)`).
**Storage**: wheel ~ (name 20 + 12 choices x 70 bytes) ~ 0.9 KB; spin row ~ 90 bytes. **~1 KB per wheel; ~1 MB per 1,000 wheels.** History worst case 30 x 90 B = 2.7 KB per wheel (**~2.7 MB per 1,000 wheels**).

## 5. API
All `@PreAuthorize("isAuthenticated()")`, base `/api/v1/wheels`.
- `GET /api/v1/wheels` -> `200 [ { "id":"…","name":"Saan kakain?","choices":[{"id":"a1b2c3d4","label":"Lasagna","color":"sea","doodle":"lasagna"}, …],"version":2,"updatedAt":"…" } ]` (newest-updated first, max 50).
- `POST /api/v1/wheels` `{ "name":"Saan pupunta?", "choices":[{"id":"x1","label":"Baguio","color":"citrus","doodle":null},{"id":"x2","label":"Tagaytay","color":"sea"}] }` -> `201` wheel. `400 {"success":false,"message":"A wheel needs 2 to 12 choices."}`.
- `PUT /api/v1/wheels/{id}` `{ "name":"…","choices":[…],"version":2 }` -> `200` wheel (version 3). `409 {"success":false,"message":"This wheel was just changed by someone else."}`; `404`.
- `DELETE /api/v1/wheels/{id}` -> `204` (spins cascade).
- `POST /api/v1/wheels/{id}/spins` `{ "choiceId":"a1b2c3d4" }` (server copies label/doodle from the CURRENT wheel; `400` if choice not found) -> `201 { "id":"…","label":"Lasagna","doodle":"lasagna","accepted":false,"spunBy":3,"spunAt":"…" }`.
- `PATCH /api/v1/wheels/spins/{spinId}` `{ "accepted": true }` -> `200`.
- `GET /api/v1/wheels/{id}/spins?limit=8` -> `200 [ … ]`; `DELETE /api/v1/wheels/{id}/spins` -> `204` (clear history).
No notification on spin (it is in-the-moment); `notifyOthers` (type `SYSTEM`, no related entity) only when a wheel is created ("Cj made a new wheel: Saan pupunta?").

## 6. Edge cases and risks
- **Two people editing the same wheel**: `version` conflict -> 409 -> editor shows "Cj changed this wheel. Load their version?" (keeps the local draft until chosen). Autosave never overwrites silently.
- **Spinning while the partner edits**: the spin uses the local snapshot; the server stores the label copy, so history stays right even if the choice vanished (POST uses `choiceId` and falls back to a `label` sent by the client if the choice no longer exists, flagged accordingly).
- **Deleting a wheel mid-spin**: result is still shown; saving the spin returns 404 -> result card shows normally, toast "That wheel was deleted, so this spin wasn't saved."
- **Old data**: new tables only. Wheels referencing a doodle that is later removed from the kit render without a doodle (never crash).
- **Fairness/exploits**: client-side randomness is fine (a couple's app). Use `crypto.getRandomValues` with rejection sampling to avoid modulo bias.
- **Performance**: SVG with <= 12 segments; rotation by CSS transform on a single `g` (GPU); confetti limited to 28 elements; ticks rate-limited; pause everything when `document.hidden`.
- **Audio**: WebAudio contexts must start after a user gesture (the Spin tap); fail silently if unavailable.
- **JSON column + `validate`**: use the exact type mapping above and test app start against a real Postgres.
- **Render**: tiny payloads; no background jobs.
- **Delete all**: existing "delete all" actions (memories, dates, love board) do not touch wheels; wheel deletion and per-wheel "Clear history" are the only wipes. If product later wants a global wipe, add `DELETE /api/v1/wheels/all` to `BulkDeleteService`.

## 7. Acceptance checklist
- [ ] 390px: wheel fits without horizontal scroll, Spin button >= 56px, chips scroll horizontally only inside their row, editor usable one-handed.
- [ ] Spin lands exactly under the pointer (verify with 2, 3, 7 and 12 choices; result label equals the segment under the pointer).
- [ ] Pointer ticks per segment; wobble at the end; confetti then result card; "Spin again" re-spins; "Let's go" saves and toasts.
- [ ] Reduced motion: instant result, no confetti/wobble.
- [ ] Create, edit inline (add, remove, recolour, rename, doodle), autosave status works; limits 2 and 12 enforced.
- [ ] Quick add from the Usual Orders menu works; "Fill from our usual orders" works.
- [ ] History shows newest 8, who spun, accepted badge; clear history works; partner sees the same wheels.
- [ ] Dark mode: wheel, ring, chips, editor, result card readable; segment labels keep contrast (ink on light, white on amalfi).
- [ ] Keyboard-only: create wheel, edit, spin, dismiss result; screen reader hears the result.
- [ ] Existing "delete all" actions still work and leave wheels intact.

# FILES I WILL PASTE BELOW
Frontend (shared, to reuse):
- fsp_frontend/src/components/ui/Modal/Modal.jsx and Modal.module.css
- fsp_frontend/src/components/ui/ConfirmDialog/ConfirmDialog.jsx
- fsp_frontend/src/components/ui/Button/Button.jsx and Button.module.css
- fsp_frontend/src/components/ui/IconButton/IconButton.jsx and IconButton.module.css
- fsp_frontend/src/components/ui/Chip/Chip.jsx and Chip.module.css
- fsp_frontend/src/components/ui/Field/Field.jsx and fsp_frontend/src/components/ui/FormControls.module.css
- fsp_frontend/src/components/ui/RadioGroup/RadioGroup.jsx and RadioGroup.module.css (ColorSwatchGroup)
- fsp_frontend/src/components/Icon/Icon.jsx and the list of icon names (from glyphs.jsx; paste glyphs.jsx only if you must add icons)
- fsp_frontend/src/constants/animations.js
- fsp_frontend/src/hooks/useMediaQuery.js and useNotification.js
- fsp_frontend/src/styles/design-tokens.css
Frontend (related, to change):
- fsp_frontend/src/App.jsx
- fsp_frontend/src/pages/HomePage.jsx and HomePage.module.css
- fsp_frontend/src/components/home/MenuBook/MenuBook.jsx (created in commit 04; paste its current content)
- fsp_frontend/src/pages/DatesPage.jsx (only the empty-state part)
- fsp_frontend/src/queries/queryKeys.js
- fsp_frontend/src/queries/queries.js
- fsp_frontend/src/queries/mutations.js
- fsp_frontend/src/services/homeService.js (service style reference)
Backend (reference + to change):
- fsp_backend/src/main/resources/db/migration/V3__drive_file_ids.sql (style reference) and V5__menu_items.sql (from commit 04)
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/controller/MenuController.java and service/MenuService.java and entity/MenuItem.java (from commit 04, as style reference)
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/service/NotificationService.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/exception/GlobalExceptionHandler.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/service/BulkDeleteService.java

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
