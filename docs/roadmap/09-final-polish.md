# 09 · Final polish: the whole-app review pass

## 1. Goal and user flow
After commits 01-08, review every page and shared control at 390px in light and dark, keyboard-only, with a screen reader pass, and with reduced motion; fix what is found; pay down everything earlier commits deferred; leave a repeatable checklist and two tiny guard scripts (hard-coded colours, story text) so the polish stays polished. No new features.

**Flow.** (1) Run the guard scripts. (2) Walk the page matrix below on a 390px viewport (DevTools device mode + one real phone) in Light, Dark, then repeat with Reduced motion on and with keyboard only. (3) Log findings as a list `page · state · what is wrong · file`. (4) Paste the failing files into AI Studio with the prompt below, one batch per area. (5) Re-run the matrix. (6) Update `docs/rebrand-progress.md`/`docs/baseline.md` with results.

## 2. UX spec (what "polished" means here)

### Page matrix (every row: Light, Dark, 390px, 1440px, keyboard, SR, reduced motion; tick each)
| Page / surface | States to open |
|---|---|
| `/auth` landing + login | day scene, night scene (dark), login error, session-expired message, story teaser, "Read our story" next-redirect, character taps (Skyrie bounce, Rorry flip), reduced motion static |
| `/home` | hero, recent memories (empty/with data), next adventures, recent note, Our usual orders counter + open menu + add/edit/delete/reorder, wheel card, bouquet card, pets widget, story card + book (all 8 states), footer |
| `/memories` albums | grid (accent colours applied), empty, loading skeleton, error, create/edit album modal (accent preview), multi-upload sheet (all row states), gallery, lightbox (download), album download progress, delete confirm, delete-all dialog |
| `/memories` calendar | month with entries, today, hover/focus, fullscreen, export PNG (light always, clean), month picker |
| `/dates` | list, empty, create/edit modal (DatePicker/TimePicker/Select), checklist, statuses (StatusChip), favourites, archive, delete-all dialog |
| `/letters` Love Board | board, composer, paper picker, sticker library (new food + flower stickers + bouquet sticker), reader modal, archive drawer, layer panel, delete-all |
| `/wheel` | empty starters, spin (ticking, wobble, confetti, result), editor limits 2/12, history, delete wheel |
| `/bouquets` | gallery empty/with data, maker (all tabs, selection handles, undo), view, export PNG, pin to board, delete |
| `/pets` | grid, stage, each action reaction (dogs and plushies), cooldown message, empty "Recent" |
| `/profile` | all cards, Appearance (theme + accent), avatar crop modal, anniversary counter |
| `/admin/*` | dashboard, users, memories, letters, dates, gallery, notifications, activity, audit, settings; sidebar; logout confirm |
| Global | Navbar (desktop), avatar menu (phone), TabBar, notification bell + panel, toasts (4 types, stacking, above TabBar), ConfirmDialog, DeleteAllDialog, ErrorBoundary snag page, PageLoader, 404 redirect, logout "Leave for now?" |

### Cross-cutting checks
1. **390px (and 360px)**: no horizontal scroll anywhere (DevTools: `document.documentElement.scrollWidth <= innerWidth`); fixed bottom UI clears the TabBar and safe area; modals fit with scroll inside; tap targets >= 44px (audit with a script: query all `button, a, [role=button], input, select` and report bounding boxes < 44px).
2. **Dark mode**: no pure-white flashes, no invisible ink-on-navy text or icons, no light-only shadows; contrast >= 4.5:1 (re-run the table in `docs/dark-mode-contrast.md`); images/photos untouched; exports (Calendar PNG, Bouquet PNG) light.
3. **Keyboard**: logical tab order; visible `:focus-visible` ring (3px tomato, 2px offset) on every control including Love Board (`lb-focus`) and admin; no keyboard traps outside modals; Escape closes the top modal only; focus returns to the opener; skip link to `main` (add if missing).
4. **Screen reader**: icon-only buttons have `aria-label`; decorative icons `aria-hidden`; meaningful icons have `label`; toasts `role=status/alert`; modals labelled; meters/progress have names; live regions throttled; page titles update per route (`document.title`).
5. **Reduced motion**: with the OS setting on, nothing loops or travels (landing, pets, wheel, story, bouquets, toasts, skeleton pulse reduced to static).
6. **Copy & tone**: warm, light Taglish, no shouting; no emoji in interface chrome (existing strings such as "Profile updated ✨", "✨ Oops! Incorrect username or password, love. Please try again! 💕" and category emoji should become plain warm text or doodle icons); no guilt words in pets ("starving", "neglected", "ignored"); consistent "love" usage (not every line).
7. **Tokens only**: no hard-coded hex outside the allow-list (icon fills in `glyphs.jsx`, LandingScene/story scene art, user-chosen colours, export backgrounds). Remove the **legacy alias block** at the bottom of `design-tokens.css` once nothing references `--color-*` (grep first); remove dead files listed as unused in the earlier audit if they still exist (`WelcomePage`, old `Card`/`Input`/`Layout`/`PinIndicator`/`CustomKeypad`, `styles/global.css`, `styles/variables.css`, `src/index.css`) after verifying with grep that nothing imports them.
8. **Performance**: lazy routes for `/wheel`, `/bouquets*`, `/pets`, story book; initial `/auth` bundle excludes the full book and bouquet maker; no layout shift on the landing; images use signed `thumb` sizes in grids; `framer-motion` animations use transforms/opacity only.
9. **Motion consistency**: enter 250-450ms expo-out, interactions 120-200ms, springs 260-400/18-34; no animation longer than 1.6s that blocks input except the story page turn (0.8s) and the wheel spin (4.6s, skippable by tapping the wheel).
10. **Delete-all matrix**: after "delete all" in Memories, Dates, Love Board: lists show their empty states (not errors), counts on Home update, notifications don't break, bouquet stickers vanish with the Love Board wipe, bouquets/wheels/menu/pets are untouched (as documented) or have their own delete-all where decided.
11. **Error paths**: backend offline, 401 expiry (redirect to `/auth` with message), 409 conflicts (menu, wheel, bouquet), Drive failure on upload/download, slow network skeletons.
12. **Data hygiene**: Flyway applies V4-V8 cleanly on a copy of the production database; `ddl-auto=validate` boots; seeds are idempotent.

### Deferred items to clear (carried from earlier commits; add any new ones discovered)
- 01: legacy album accent hexes are remapped on read only; optionally write a Flyway data fix (not required).
- 02: orphan Drive files from failed saves are not swept; per-user session rate limit not implemented; zip parts capped at 120 photos/350 MB.
- 03: any component still using the legacy `--color-*` aliases; admin pages' dark pass; Tailwind arbitrary colours in Love Board files not yet migrated.
- 04: no "delete all" for the menu; optional images for foods (none by design).
- 05: no global "delete all wheels"; sound is off by default.
- 06: bouquet "delete all" lives in the gallery only; recipe `v:2` migrator not written; bouquet sticker fallback icon.
- 07: scenes 2-6 not in the logged-out bundle; translation of the story is out of scope.
- 08: no pet reset; per-dog drawings use collars until real drawings exist.

### Tiny guard scripts (no new dependencies; plain node)
- `scripts/check-colors.mjs`: scans `fsp_frontend/src/**/*.{css,jsx,js}` for `#[0-9a-fA-F]{3,8}` and `rgb(a)(`, ignores an allow-list (`components/Icon/glyphs.jsx`, `components/landing/**`, `components/story/scenes/**`, `constants/profileOptions.js`, `constants/loveBoardConstants.js`, `utils/noteCanvas.js`, `styles/design-tokens.css`) and prints file:line for the rest; exit code 1 if any (or just report).
- `scripts/check-our-story.mjs` from commit 07.
- `scripts/check-tap-targets.md`: a copy-paste DevTools snippet (documented only) that lists elements smaller than 44x44 on the current page.

## 3. Files to change / add
This commit is driven by findings, so the file list is: everything the matrix flags, plus these known items.
Frontend:
- ADD `fsp_frontend/scripts/check-colors.mjs` (next to `build-brand-assets.mjs`), `docs/polish-checklist.md` (the matrix as a living checklist with dates), `docs/dark-mode-contrast.md` (update).
- CHANGE `fsp_frontend/src/styles/design-tokens.css`: delete the legacy alias block once unused.
- CHANGE any `.module.css`/`.jsx` flagged by `check-colors`.
- CHANGE copy files with emoji in chrome (grep for emoji ranges in `pages/*.jsx`, `context/*`, `components/**`, `constants/*`): `AuthPage.jsx`, `ProfilePage.jsx`, `constants/profileOptions.js` (EMOJI_OPTIONS are user content, keep), category emoji in date categories (data, leave).
- CHANGE `fsp_frontend/index.html`: verify `theme-color`, favicon type (the brand favicon SVG in `docs/brand`), `lang="en"`, viewport meta without `user-scalable=no`.
- CHANGE `fsp_frontend/src/App.jsx`: route-level `document.title` hook, skip link.
- CHANGE `fsp_frontend/src/components/layout/Navbar/Navbar.jsx`, `TabBar.jsx`: final a11y/focus fixes if flagged.
- DELETE dead files after grep verification (list above), one by one.
Backend:
- CHANGE only if findings require (e.g. missing indexes for new tables: `idx_*` created in V5-V8 already; run `EXPLAIN` on the list queries once).
- Optional ADD `V9__tidy.sql` only if a data fix is needed (e.g. normalise legacy album accent hexes: `UPDATE memory_folders SET accent_color = '#FF9F1C' WHERE accent_color IN ('#C73616','#E38A96','#D97785')` — only if the team prefers persisting the remap).

## 4. Data
No new tables. Optional one-off `V9` data fix above (0 bytes added). Estimates: none.

## 5. API
No new endpoints. Verify the full list works end to end: `/api/v1/memories/*`, `/uploads/session`, `/media/*`, `/menu-items`, `/wheels`, `/bouquets`, `/pets`, `/profile/theme`, `/love-board/*`, `/dates/*`, `/home/summary`, bulk delete routes. Error codes seen: 400, 401, 403, 404, 409, 413, 429, 502.

## 6. Edge cases and risks
- **Scope creep**: only fix what the matrix finds; log feature ideas separately.
- **Regression risk from deleting dead code**: delete one file at a time with `grep -rn` proof, build after each (the owner runs the build; AI Studio cannot).
- **Dark mode long tail**: expect 20-40 small contrast fixes; change tokens first, components second.
- **Real devices**: iOS Safari quirks (100vh, safe areas, date inputs, download behaviour, HEIC) and Android Chrome (pull-to-refresh near the Love Board canvas) need at least one real-device pass.
- **Concurrent editing paths**: re-test 409 flows with two browsers.
- **Old data**: albums with legacy accents, notes with legacy papers (`LEGACY_PAPERS`), photos with Supabase URLs only.
- **Drive failures**: simulate a 403/404 for one photo in grid, lightbox, zip.

## 7. Acceptance checklist
- [ ] Every row of the page matrix ticked for Light/Dark/390/1440/keyboard/SR/reduced motion (record date + tester in `docs/polish-checklist.md`).
- [ ] `node fsp_frontend/scripts/check-colors.mjs` reports nothing outside the allow-list; `node scripts/check-our-story.mjs` passes.
- [ ] No horizontal scroll at 360 and 390px on any page; no tap target under 44px except inline text links.
- [ ] Contrast table complete and >= 4.5:1.
- [ ] No emoji left in interface chrome; no guilt words in pet copy.
- [ ] Legacy token aliases and verified-dead files removed; app builds and lints (`npm run build`, `npm run lint`) with no new warnings; backend boots with Flyway V4-V8 on a production copy.
- [ ] "Delete all" in Memories, Dates and Love Board verified against new features (documented behaviour matches reality).
- [ ] Keyboard-only walk through logout confirm, upload sheet, menu book, wheel, bouquet maker, pets, story book succeeds.

## 8. Commit title
`Final polish: whole-app review at 390px in light and dark, keyboard and reduced motion, plus deferred cleanups`

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

# FEATURE SPEC (09 · Final polish: the whole-app review pass)

## 1. Goal and user flow
After commits 01-08, review every page and shared control at 390px in light and dark, keyboard-only, with a screen reader pass, and with reduced motion; fix what is found; pay down everything earlier commits deferred; leave a repeatable checklist and two tiny guard scripts (hard-coded colours, story text) so the polish stays polished. No new features.

**Flow.** (1) Run the guard scripts. (2) Walk the page matrix below on a 390px viewport (DevTools device mode + one real phone) in Light, Dark, then repeat with Reduced motion on and with keyboard only. (3) Log findings as a list `page · state · what is wrong · file`. (4) Paste the failing files into AI Studio with the prompt below, one batch per area. (5) Re-run the matrix. (6) Update `docs/rebrand-progress.md`/`docs/baseline.md` with results.

## 2. UX spec (what "polished" means here)

### Page matrix (every row: Light, Dark, 390px, 1440px, keyboard, SR, reduced motion; tick each)
| Page / surface | States to open |
|---|---|
| `/auth` landing + login | day scene, night scene (dark), login error, session-expired message, story teaser, "Read our story" next-redirect, character taps (Skyrie bounce, Rorry flip), reduced motion static |
| `/home` | hero, recent memories (empty/with data), next adventures, recent note, Our usual orders counter + open menu + add/edit/delete/reorder, wheel card, bouquet card, pets widget, story card + book (all 8 states), footer |
| `/memories` albums | grid (accent colours applied), empty, loading skeleton, error, create/edit album modal (accent preview), multi-upload sheet (all row states), gallery, lightbox (download), album download progress, delete confirm, delete-all dialog |
| `/memories` calendar | month with entries, today, hover/focus, fullscreen, export PNG (light always, clean), month picker |
| `/dates` | list, empty, create/edit modal (DatePicker/TimePicker/Select), checklist, statuses (StatusChip), favourites, archive, delete-all dialog |
| `/letters` Love Board | board, composer, paper picker, sticker library (new food + flower stickers + bouquet sticker), reader modal, archive drawer, layer panel, delete-all |
| `/wheel` | empty starters, spin (ticking, wobble, confetti, result), editor limits 2/12, history, delete wheel |
| `/bouquets` | gallery empty/with data, maker (all tabs, selection handles, undo), view, export PNG, pin to board, delete |
| `/pets` | grid, stage, each action reaction (dogs and plushies), cooldown message, empty "Recent" |
| `/profile` | all cards, Appearance (theme + accent), avatar crop modal, anniversary counter |
| `/admin/*` | dashboard, users, memories, letters, dates, gallery, notifications, activity, audit, settings; sidebar; logout confirm |
| Global | Navbar (desktop), avatar menu (phone), TabBar, notification bell + panel, toasts (4 types, stacking, above TabBar), ConfirmDialog, DeleteAllDialog, ErrorBoundary snag page, PageLoader, 404 redirect, logout "Leave for now?" |

### Cross-cutting checks
1. **390px (and 360px)**: no horizontal scroll anywhere (DevTools: `document.documentElement.scrollWidth <= innerWidth`); fixed bottom UI clears the TabBar and safe area; modals fit with scroll inside; tap targets >= 44px (audit with a script: query all `button, a, [role=button], input, select` and report bounding boxes < 44px).
2. **Dark mode**: no pure-white flashes, no invisible ink-on-navy text or icons, no light-only shadows; contrast >= 4.5:1 (re-run the table in `docs/dark-mode-contrast.md`); images/photos untouched; exports (Calendar PNG, Bouquet PNG) light.
3. **Keyboard**: logical tab order; visible `:focus-visible` ring (3px tomato, 2px offset) on every control including Love Board (`lb-focus`) and admin; no keyboard traps outside modals; Escape closes the top modal only; focus returns to the opener; skip link to `main` (add if missing).
4. **Screen reader**: icon-only buttons have `aria-label`; decorative icons `aria-hidden`; meaningful icons have `label`; toasts `role=status/alert`; modals labelled; meters/progress have names; live regions throttled; page titles update per route (`document.title`).
5. **Reduced motion**: with the OS setting on, nothing loops or travels (landing, pets, wheel, story, bouquets, toasts, skeleton pulse reduced to static).
6. **Copy & tone**: warm, light Taglish, no shouting; no emoji in interface chrome (existing strings such as "Profile updated ✨", "✨ Oops! Incorrect username or password, love. Please try again! 💕" and category emoji should become plain warm text or doodle icons); no guilt words in pets ("starving", "neglected", "ignored"); consistent "love" usage (not every line).
7. **Tokens only**: no hard-coded hex outside the allow-list (icon fills in `glyphs.jsx`, LandingScene/story scene art, user-chosen colours, export backgrounds). Remove the **legacy alias block** at the bottom of `design-tokens.css` once nothing references `--color-*` (grep first); remove dead files listed as unused in the earlier audit if they still exist (`WelcomePage`, old `Card`/`Input`/`Layout`/`PinIndicator`/`CustomKeypad`, `styles/global.css`, `styles/variables.css`, `src/index.css`) after verifying with grep that nothing imports them.
8. **Performance**: lazy routes for `/wheel`, `/bouquets*`, `/pets`, story book; initial `/auth` bundle excludes the full book and bouquet maker; no layout shift on the landing; images use signed `thumb` sizes in grids; `framer-motion` animations use transforms/opacity only.
9. **Motion consistency**: enter 250-450ms expo-out, interactions 120-200ms, springs 260-400/18-34; no animation longer than 1.6s that blocks input except the story page turn (0.8s) and the wheel spin (4.6s, skippable by tapping the wheel).
10. **Delete-all matrix**: after "delete all" in Memories, Dates, Love Board: lists show their empty states (not errors), counts on Home update, notifications don't break, bouquet stickers vanish with the Love Board wipe, bouquets/wheels/menu/pets are untouched (as documented) or have their own delete-all where decided.
11. **Error paths**: backend offline, 401 expiry (redirect to `/auth` with message), 409 conflicts (menu, wheel, bouquet), Drive failure on upload/download, slow network skeletons.
12. **Data hygiene**: Flyway applies V4-V8 cleanly on a copy of the production database; `ddl-auto=validate` boots; seeds are idempotent.

### Deferred items to clear (carried from earlier commits; add any new ones discovered)
- 01: legacy album accent hexes are remapped on read only; optionally write a Flyway data fix (not required).
- 02: orphan Drive files from failed saves are not swept; per-user session rate limit not implemented; zip parts capped at 120 photos/350 MB.
- 03: any component still using the legacy `--color-*` aliases; admin pages' dark pass; Tailwind arbitrary colours in Love Board files not yet migrated.
- 04: no "delete all" for the menu; optional images for foods (none by design).
- 05: no global "delete all wheels"; sound is off by default.
- 06: bouquet "delete all" lives in the gallery only; recipe `v:2` migrator not written; bouquet sticker fallback icon.
- 07: scenes 2-6 not in the logged-out bundle; translation of the story is out of scope.
- 08: no pet reset; per-dog drawings use collars until real drawings exist.

### Tiny guard scripts (no new dependencies; plain node)
- `scripts/check-colors.mjs`: scans `fsp_frontend/src/**/*.{css,jsx,js}` for `#[0-9a-fA-F]{3,8}` and `rgb(a)(`, ignores an allow-list (`components/Icon/glyphs.jsx`, `components/landing/**`, `components/story/scenes/**`, `constants/profileOptions.js`, `constants/loveBoardConstants.js`, `utils/noteCanvas.js`, `styles/design-tokens.css`) and prints file:line for the rest; exit code 1 if any (or just report).
- `scripts/check-our-story.mjs` from commit 07.
- `scripts/check-tap-targets.md`: a copy-paste DevTools snippet (documented only) that lists elements smaller than 44x44 on the current page.

## 3. Files to change / add
This commit is driven by findings, so the file list is: everything the matrix flags, plus these known items.
Frontend:
- ADD `fsp_frontend/scripts/check-colors.mjs` (next to `build-brand-assets.mjs`), `docs/polish-checklist.md` (the matrix as a living checklist with dates), `docs/dark-mode-contrast.md` (update).
- CHANGE `fsp_frontend/src/styles/design-tokens.css`: delete the legacy alias block once unused.
- CHANGE any `.module.css`/`.jsx` flagged by `check-colors`.
- CHANGE copy files with emoji in chrome (grep for emoji ranges in `pages/*.jsx`, `context/*`, `components/**`, `constants/*`): `AuthPage.jsx`, `ProfilePage.jsx`, `constants/profileOptions.js` (EMOJI_OPTIONS are user content, keep), category emoji in date categories (data, leave).
- CHANGE `fsp_frontend/index.html`: verify `theme-color`, favicon type (the brand favicon SVG in `docs/brand`), `lang="en"`, viewport meta without `user-scalable=no`.
- CHANGE `fsp_frontend/src/App.jsx`: route-level `document.title` hook, skip link.
- CHANGE `fsp_frontend/src/components/layout/Navbar/Navbar.jsx`, `TabBar.jsx`: final a11y/focus fixes if flagged.
- DELETE dead files after grep verification (list above), one by one.
Backend:
- CHANGE only if findings require (e.g. missing indexes for new tables: `idx_*` created in V5-V8 already; run `EXPLAIN` on the list queries once).
- Optional ADD `V9__tidy.sql` only if a data fix is needed (e.g. normalise legacy album accent hexes: `UPDATE memory_folders SET accent_color = '#FF9F1C' WHERE accent_color IN ('#C73616','#E38A96','#D97785')` — only if the team prefers persisting the remap).

## 4. Data
No new tables. Optional one-off `V9` data fix above (0 bytes added). Estimates: none.

## 5. API
No new endpoints. Verify the full list works end to end: `/api/v1/memories/*`, `/uploads/session`, `/media/*`, `/menu-items`, `/wheels`, `/bouquets`, `/pets`, `/profile/theme`, `/love-board/*`, `/dates/*`, `/home/summary`, bulk delete routes. Error codes seen: 400, 401, 403, 404, 409, 413, 429, 502.

## 6. Edge cases and risks
- **Scope creep**: only fix what the matrix finds; log feature ideas separately.
- **Regression risk from deleting dead code**: delete one file at a time with `grep -rn` proof, build after each (the owner runs the build; AI Studio cannot).
- **Dark mode long tail**: expect 20-40 small contrast fixes; change tokens first, components second.
- **Real devices**: iOS Safari quirks (100vh, safe areas, date inputs, download behaviour, HEIC) and Android Chrome (pull-to-refresh near the Love Board canvas) need at least one real-device pass.
- **Concurrent editing paths**: re-test 409 flows with two browsers.
- **Old data**: albums with legacy accents, notes with legacy papers (`LEGACY_PAPERS`), photos with Supabase URLs only.
- **Drive failures**: simulate a 403/404 for one photo in grid, lightbox, zip.

## 7. Acceptance checklist
- [ ] Every row of the page matrix ticked for Light/Dark/390/1440/keyboard/SR/reduced motion (record date + tester in `docs/polish-checklist.md`).
- [ ] `node fsp_frontend/scripts/check-colors.mjs` reports nothing outside the allow-list; `node scripts/check-our-story.mjs` passes.
- [ ] No horizontal scroll at 360 and 390px on any page; no tap target under 44px except inline text links.
- [ ] Contrast table complete and >= 4.5:1.
- [ ] No emoji left in interface chrome; no guilt words in pet copy.
- [ ] Legacy token aliases and verified-dead files removed; app builds and lints (`npm run build`, `npm run lint`) with no new warnings; backend boots with Flyway V4-V8 on a production copy.
- [ ] "Delete all" in Memories, Dates and Love Board verified against new features (documented behaviour matches reality).
- [ ] Keyboard-only walk through logout confirm, upload sheet, menu book, wheel, bouquet maker, pets, story book succeeds.

# FILES I WILL PASTE BELOW
This prompt is run once per area that the review flagged. Paste ONLY the files for the area you are fixing, plus these always-needed ones:
Always:
- fsp_frontend/src/styles/design-tokens.css
- fsp_frontend/src/styles/reset.css
- fsp_frontend/src/components/ui/Button/Button.jsx and Button.module.css
- fsp_frontend/src/components/ui/IconButton/IconButton.jsx and IconButton.module.css
- fsp_frontend/src/components/ui/Modal/Modal.jsx and Modal.module.css
- fsp_frontend/src/components/ui/FormControls.module.css
- fsp_frontend/src/components/Icon/Icon.jsx
- docs/polish-checklist.md (your list of findings for this batch: page, state, what is wrong, file)
Per area (pick what you need):
- Landing/Auth: fsp_frontend/src/pages/AuthPage.jsx, AuthPage.module.css, components/landing/LandingScene.jsx, LandingScene.module.css, components/story/StoryTeaser/*
- Home: fsp_frontend/src/pages/HomePage.jsx, HomePage.module.css, components/home/*
- Memories: fsp_frontend/src/pages/MemoriesPage.jsx, MemoriesPage.module.css, components/memories/**
- Dates: fsp_frontend/src/pages/DatesPage.jsx, DatesPage.module.css
- Love Board: fsp_frontend/src/pages/LoveLettersPage.jsx and components/loveBoard/** (send the flagged files)
- Wheel / Bouquets / Pets / Story: the pages and components folders created in commits 05-08
- Profile / Admin / layout: fsp_frontend/src/pages/ProfilePage.jsx, ProfilePage.module.css, components/layout/**, components/admin/** (flagged files only)
- Scripts: fsp_frontend/scripts/check-colors.mjs (if already created), scripts/check-our-story.mjs

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
