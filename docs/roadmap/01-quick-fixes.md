# 01 · Quick fixes (logout confirm, clean Calendar PNG, album accent)

## 1. Goal and user flow
Three small, independent polish fixes that every later commit benefits from. No database change.

**Flow A, Logout.** (phone) tap avatar -> menu -> "Sign out" -> a ConfirmDialog "Leave for now?" -> "Stay" / "Leave" -> signed out and sent to `/auth`. (desktop) tap the sign-out icon button in the navbar -> same dialog.
**Flow B, Calendar PNG.** Memories -> Calendar -> "Export PNG" (the toolbar button) -> a PNG downloads that looks like a clean scrapbook sheet, with no "today" highlight, no hover caption, no focus ring, no selected-day state.
**Flow C, Album accent.** Create/edit album -> pick an accent swatch -> the album card in the grid, the album header band and the photo-selected states in the gallery all take that colour immediately after saving.

## 2. UX spec

### A. Logout confirm
- Both entry points (`Navbar.jsx`: `AvatarMenu` `onLogout` at the "Sign out" menu item, and the desktop `iconBtn` with `aria-label="Sign out"`) open ONE shared `ConfirmDialog` owned by `Navbar` (do not create two). Also check `components/admin/AdminLayout.jsx` and `components/admin/Sidebar.jsx`, which also call `logout`: the admin console gets the same dialog (reuse a tiny `useConfirmLogout()` hook or a `LogoutConfirm` component in `components/layout/` so there is one source of copy).
- Dialog: Use `icon="house"` (hearts are reserved for love moments). Title **"Leave for now?"**. Message **"We'll keep everything safe until you're back, love."** Confirm label **"Leave"** (not danger: it is not destructive, so `danger={false}`; the confirm button stays the primary tomato button). Cancel label **"Stay"**. Busy label **"Leaving…"**.
- States: closed / open / busy (logout is instant, but `logout()` may be async: disable both buttons, `busy`). Error: if `logout()` throws, show `error="Couldn't sign you out. Try again?"`; the user stays signed in.
- Phone (390px): the avatar menu closes first (so focus does not get trapped under it), then the dialog opens centered, width `min(92vw, 420px)`. Desktop 1440px: same dialog centered.
- Keyboard: Enter on the focused "Leave" confirms; Escape or "Stay" closes and returns focus to the control that opened it (the avatar button or sign-out icon button; `Modal` already restores focus). Initial focus on "Stay" is NOT required (Modal decides); do not auto-focus the destructive-ish action.
- Dark mode: uses `ConfirmDialog`, nothing extra.

### B. Calendar PNG export
- Today the export calls `html2canvas(sheetRef.current, {backgroundColor:'#FFF8E8', scale:Math.max(3, devicePixelRatio||1), useCORS:true})` in `CalendarView.jsx` (`handleExportPng`, ~line 381). The live sheet carries interactive styles: `.dayCellToday` (gelato fill + 3px citrus inset ring), `.dayCellFilled:hover` and `.dayHoverInfo` (hover caption), `:focus-visible` outlines on day buttons, and a dragging state `.dayCellDragging`.
- Fix with html2canvas's `onclone(clonedDoc, clonedEl)` option (changes only the cloned DOM, so the user sees nothing flicker): add class `exporting` to the cloned sheet root; in `CalendarView.module.css` add rules scoped to `.calendarSheet.exporting`: `.dayCellToday { background: var(--white); box-shadow: none }` (match a normal empty day cell colour; read `.dayCell` for the exact fill), `.dayHoverInfo { display:none }`, `* { outline: none !important }`, `.dayCellDragging { transform:none; box-shadow:none }`, remove any `:hover` transform. Also blur the active element before capture (`document.activeElement?.blur()`) and clear any selected-day state if one exists (grep `selected`/`aria-pressed`/`aria-current` in `CalendarView.jsx`; `aria-current="date"` styling must also be neutralised in `.exporting`).
- Keep the exported file name and scale. Keep the `exporting` state (button shows busy, `aria-busy`). Success toast "Saved your calendar sheet" (type `success`), failure toast "Couldn't make the picture. Try again?" (type `error`) (today failures only `console.error`).
- PNG exports stay on the light palette even after commit 03: `.exporting` must force light token values by setting the light values on the cloned root (add `data-theme="light"` on the clone; commit 03 defines the selector; until then it is a harmless attribute).
- Fullscreen sheet (`calendarSheetFullscreen`): export works from both the inline and the fullscreen sheet.

### C. Album accent colour
**Diagnosis (from reading the code, not from running it):**
1. Saved correctly: form `folderForm.accentColor` -> `memoryService` -> `memory_folders.accent_color` (varchar(20)) -> `FolderDTO.accentColor` -> `MemoriesPage.jsx` `displayAccent()`.
2. The ONLY place it is drawn is `.accentBar` in the gallery header (`MemoriesPage.jsx` line ~763): an 8px-wide pill with a 2px ink border, i.e. about 4px of visible colour next to a big title. The album **cards** in the grid (`<article className={styles.folderCard}>`, line ~693) never read it: their shadow is always `var(--sea)`, cover tint cycles through `COVER_TINTS`. So the swatch feels like it "does nothing".
3. Legacy data makes it worse: the backend default is still `"#C73616"` (`FolderRequestDTO`, `MemoryFolder`, `MemoryService.createFolder`), and `displayAccent` maps every old hex (`#C73616 #E38A96 #D97785 -> citrus`, etc.), so almost every existing album shows Citrus, and Citrus is also the default pick; users cannot see a difference.
4. Gelato (`#FFE680`) and Sea on a cream/white background give very low contrast for a thin bar, and Amalfi/Ink need white text on top.

**What the accent should colour (all driven by one CSS variable `--album-accent` set inline on the card / header, plus `--album-accent-ink` for text on it):**
- Album card: offset shadow becomes `6px 6px 0 var(--album-accent)` (hover `8px 8px 0`); a 10px top band under the cover border; the cover placeholder fill (when no cover photo) uses `color-mix(in srgb, var(--album-accent) 35%, var(--white))` instead of cycling `COVER_TINTS`; the photo-count pill uses the accent as background with `--album-accent-ink` text.
- Album header (gallery view): replace the 8px bar with a full-width soft band behind the title block: `background: color-mix(in srgb, var(--album-accent) 22%, var(--white))`, 2px ink border, `--radius-card`, with the old bar kept as a 14px accent dot next to the title. The title stays `--ink` on this tinted plate (contrast-safe because the mix is at most 22%).
- Gallery selected states: the selected/focused photo in the grid gets `outline: 3px solid var(--album-accent)` + ink 2px border; the "On the calendar" badge and the highlight-picker ring use the accent; active filter chips inside the album use the accent as fill.
- Accent set: keep the 5 swatches (Citrus `#FF9F1C`, Sea `#5CB3FF`, Gelato `#FFE680`, Amalfi `#1F55C9`, Ink `#172B70`); Tomato is NOT offered as an accent (tomato is reserved for primary actions and hearts). Add a helper `albumAccent(hex) -> { hex, ink }` in a new `constants/albumAccents.js` (ink `#FFFFFF` for Amalfi and Ink, else `#172B70`), moving `PALETTE_ACCENTS`, `LEGACY_ACCENTS`, `displayAccent` out of `MemoriesPage.jsx`.
- Backend default changed to Citrus `"#FF9F1C"` so new albums are not legacy; no data migration (legacy hexes keep being mapped on read, and the album form already normalises on edit).
- Because legacy albums all map to Citrus: when an album has a legacy hex, map them to DIFFERENT palette colours by hashing the folder id into the 5 swatches ONLY IF the stored hex is one of the legacy values (so the grid is colourful instead of all orange). Persisting is not done; the next edit saves a real palette value.
- States: loading skeleton uses neutral `--sea-tint`; empty album: cover shows accent tint + doodle; error: unchanged; disabled: n/a. Dark mode (commit 03): tint mixes against `--white` token so they follow the theme; `--album-accent-ink` stays as computed.
- Phone 390px: grid is 1 column (`minmax(260px,1fr)`), shadows 6px stay inside the 16px gutter (check no horizontal scroll from the shadow).
- Motion: card hover keeps the existing 0.15s translate; changing the accent in the form previews live in a small mini-card inside the modal (new `AlbumAccentPreview`, 120ms colour transition, none on reduced motion).

## 3. Files to change / add
Frontend:
- CHANGE `fsp_frontend/src/components/layout/Navbar/Navbar.jsx`: route both sign-out entry points through one `ConfirmDialog`.
- CHANGE `fsp_frontend/src/components/admin/AdminLayout.jsx` and `fsp_frontend/src/components/admin/Sidebar.jsx`: use the same confirm (admin logout).
- ADD `fsp_frontend/src/components/layout/LogoutConfirm/LogoutConfirm.jsx`: the shared dialog (props `open`, `onClose`), reads `useAuth().logout`.
- CHANGE `fsp_frontend/src/components/memories/CalendarDump/CalendarView.jsx`: `onclone`, blur, toasts, `exporting` class.
- CHANGE `fsp_frontend/src/components/memories/CalendarDump/CalendarView.module.css`: `.calendarSheet.exporting ...` rules.
- CHANGE `fsp_frontend/src/pages/MemoriesPage.jsx`: use `--album-accent` on cards, header band, selected states; import accent helper; live preview in the album modal.
- CHANGE `fsp_frontend/src/pages/MemoriesPage.module.css`: `.folderCard`, `.cover`, `.albumHeader`, `.accentBar`, selected-photo styles read the variable.
- ADD `fsp_frontend/src/constants/albumAccents.js`: palette, legacy map, `albumAccent()`, deterministic legacy remap.
Backend:
- CHANGE `fsp_backend/src/main/java/com/forsneakypea/fspbackend/dto/FolderRequestDTO.java`, `entity/MemoryFolder.java`, `service/MemoryService.java`: default accent `"#FF9F1C"` instead of `"#C73616"` (three places, line ~21, ~32, ~78).

## 4. Data
No Flyway migration. Storage unchanged (`accent_color` varchar(20), ~9 bytes/album). Nothing to estimate: 0 bytes added per 1,000 items.

## 5. API
No new endpoints. `POST/PUT /api/v1/memories/folders` already accept `{ "accentColor": "#5CB3FF" }`; response `FolderDTO.accentColor` unchanged. Server-side validation to add in `MemoryService`: accept only `^#[0-9A-Fa-f]{6}$` else `400 {"success":false,"message":"Pick one of the album colours."}`; the five palette values are not enforced server-side (legacy values must still load).

## 6. Edge cases and risks
- Two people editing the same album: last write wins on `accentColor`; the other tab picks it up on the next `folders` query refetch (staleTime 30s). Acceptable.
- Logout while an upload/export is running: the dialog message stays the same; the in-flight request is cancelled by the page unmount. Do not block logout.
- Logout in two tabs: `AuthProvider` clears the query client; the second tab's next 401 redirects to `/auth`.
- PNG: `onclone` runs on a clone, so images (Drive signed URLs, `useCORS:true`) behave as before; if an image fails CORS, html2canvas draws it blank (existing behaviour). Large months at scale 3 can use ~100+ MB on low-end phones: keep the scale but catch the error and retry once at scale 2.
- Legacy remap by id hash: only for legacy hexes, deterministic (same album always same colour), never written back.
- Gelato accent: ensure the card shadow is visible on `--paper` (it is, because the 2px ink border carries the shape); header band at 22% gelato is intentionally subtle.
- "Delete all" for memories: unaffected.

## 7. Acceptance checklist
- [ ] 390px: avatar menu -> Sign out -> "Leave for now?" opens centered, no horizontal scroll; "Stay" keeps session; "Leave" signs out.
- [ ] Desktop: navbar sign-out icon opens the same dialog; admin sidebar/top bar sign-out also asks.
- [ ] Dark mode (after commit 03): dialog readable; exported PNG still light.
- [ ] Keyboard: Tab cycles inside the dialog, Esc closes, focus returns to the opener, Enter on "Leave" signs out.
- [ ] Screen reader: dialog announced as "Leave for now?" with the message; buttons named "Stay" / "Leave".
- [ ] Reduced motion: no new animations; accent preview swaps instantly.
- [ ] Export PNG: open the current month while "today" is in it, hover a day, tab-focus a day, export: no today ring, no caption, no focus ring.
- [ ] Create albums in all 5 accents: each card, header band and selected photo shows that colour; editing the accent updates all three after save.
- [ ] Old albums (legacy hex) show varied palette colours, not all orange.
- [ ] "Delete all" memories still works.

## 8. Commit title
`Quick fixes: confirm before sign-out, clean Calendar PNG export, album accent colours the card, header and selection`

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

# FEATURE SPEC (01 · Quick fixes (logout confirm, clean Calendar PNG, album accent))

## 1. Goal and user flow
Three small, independent polish fixes that every later commit benefits from. No database change.

**Flow A, Logout.** (phone) tap avatar -> menu -> "Sign out" -> a ConfirmDialog "Leave for now?" -> "Stay" / "Leave" -> signed out and sent to `/auth`. (desktop) tap the sign-out icon button in the navbar -> same dialog.
**Flow B, Calendar PNG.** Memories -> Calendar -> "Export PNG" (the toolbar button) -> a PNG downloads that looks like a clean scrapbook sheet, with no "today" highlight, no hover caption, no focus ring, no selected-day state.
**Flow C, Album accent.** Create/edit album -> pick an accent swatch -> the album card in the grid, the album header band and the photo-selected states in the gallery all take that colour immediately after saving.

## 2. UX spec

### A. Logout confirm
- Both entry points (`Navbar.jsx`: `AvatarMenu` `onLogout` at the "Sign out" menu item, and the desktop `iconBtn` with `aria-label="Sign out"`) open ONE shared `ConfirmDialog` owned by `Navbar` (do not create two). Also check `components/admin/AdminLayout.jsx` and `components/admin/Sidebar.jsx`, which also call `logout`: the admin console gets the same dialog (reuse a tiny `useConfirmLogout()` hook or a `LogoutConfirm` component in `components/layout/` so there is one source of copy).
- Dialog: Use `icon="house"` (hearts are reserved for love moments). Title **"Leave for now?"**. Message **"We'll keep everything safe until you're back, love."** Confirm label **"Leave"** (not danger: it is not destructive, so `danger={false}`; the confirm button stays the primary tomato button). Cancel label **"Stay"**. Busy label **"Leaving…"**.
- States: closed / open / busy (logout is instant, but `logout()` may be async: disable both buttons, `busy`). Error: if `logout()` throws, show `error="Couldn't sign you out. Try again?"`; the user stays signed in.
- Phone (390px): the avatar menu closes first (so focus does not get trapped under it), then the dialog opens centered, width `min(92vw, 420px)`. Desktop 1440px: same dialog centered.
- Keyboard: Enter on the focused "Leave" confirms; Escape or "Stay" closes and returns focus to the control that opened it (the avatar button or sign-out icon button; `Modal` already restores focus). Initial focus on "Stay" is NOT required (Modal decides); do not auto-focus the destructive-ish action.
- Dark mode: uses `ConfirmDialog`, nothing extra.

### B. Calendar PNG export
- Today the export calls `html2canvas(sheetRef.current, {backgroundColor:'#FFF8E8', scale:Math.max(3, devicePixelRatio||1), useCORS:true})` in `CalendarView.jsx` (`handleExportPng`, ~line 381). The live sheet carries interactive styles: `.dayCellToday` (gelato fill + 3px citrus inset ring), `.dayCellFilled:hover` and `.dayHoverInfo` (hover caption), `:focus-visible` outlines on day buttons, and a dragging state `.dayCellDragging`.
- Fix with html2canvas's `onclone(clonedDoc, clonedEl)` option (changes only the cloned DOM, so the user sees nothing flicker): add class `exporting` to the cloned sheet root; in `CalendarView.module.css` add rules scoped to `.calendarSheet.exporting`: `.dayCellToday { background: var(--white); box-shadow: none }` (match a normal empty day cell colour; read `.dayCell` for the exact fill), `.dayHoverInfo { display:none }`, `* { outline: none !important }`, `.dayCellDragging { transform:none; box-shadow:none }`, remove any `:hover` transform. Also blur the active element before capture (`document.activeElement?.blur()`) and clear any selected-day state if one exists (grep `selected`/`aria-pressed`/`aria-current` in `CalendarView.jsx`; `aria-current="date"` styling must also be neutralised in `.exporting`).
- Keep the exported file name and scale. Keep the `exporting` state (button shows busy, `aria-busy`). Success toast "Saved your calendar sheet" (type `success`), failure toast "Couldn't make the picture. Try again?" (type `error`) (today failures only `console.error`).
- PNG exports stay on the light palette even after commit 03: `.exporting` must force light token values by setting the light values on the cloned root (add `data-theme="light"` on the clone; commit 03 defines the selector; until then it is a harmless attribute).
- Fullscreen sheet (`calendarSheetFullscreen`): export works from both the inline and the fullscreen sheet.

### C. Album accent colour
**Diagnosis (from reading the code, not from running it):**
1. Saved correctly: form `folderForm.accentColor` -> `memoryService` -> `memory_folders.accent_color` (varchar(20)) -> `FolderDTO.accentColor` -> `MemoriesPage.jsx` `displayAccent()`.
2. The ONLY place it is drawn is `.accentBar` in the gallery header (`MemoriesPage.jsx` line ~763): an 8px-wide pill with a 2px ink border, i.e. about 4px of visible colour next to a big title. The album **cards** in the grid (`<article className={styles.folderCard}>`, line ~693) never read it: their shadow is always `var(--sea)`, cover tint cycles through `COVER_TINTS`. So the swatch feels like it "does nothing".
3. Legacy data makes it worse: the backend default is still `"#C73616"` (`FolderRequestDTO`, `MemoryFolder`, `MemoryService.createFolder`), and `displayAccent` maps every old hex (`#C73616 #E38A96 #D97785 -> citrus`, etc.), so almost every existing album shows Citrus, and Citrus is also the default pick; users cannot see a difference.
4. Gelato (`#FFE680`) and Sea on a cream/white background give very low contrast for a thin bar, and Amalfi/Ink need white text on top.

**What the accent should colour (all driven by one CSS variable `--album-accent` set inline on the card / header, plus `--album-accent-ink` for text on it):**
- Album card: offset shadow becomes `6px 6px 0 var(--album-accent)` (hover `8px 8px 0`); a 10px top band under the cover border; the cover placeholder fill (when no cover photo) uses `color-mix(in srgb, var(--album-accent) 35%, var(--white))` instead of cycling `COVER_TINTS`; the photo-count pill uses the accent as background with `--album-accent-ink` text.
- Album header (gallery view): replace the 8px bar with a full-width soft band behind the title block: `background: color-mix(in srgb, var(--album-accent) 22%, var(--white))`, 2px ink border, `--radius-card`, with the old bar kept as a 14px accent dot next to the title. The title stays `--ink` on this tinted plate (contrast-safe because the mix is at most 22%).
- Gallery selected states: the selected/focused photo in the grid gets `outline: 3px solid var(--album-accent)` + ink 2px border; the "On the calendar" badge and the highlight-picker ring use the accent; active filter chips inside the album use the accent as fill.
- Accent set: keep the 5 swatches (Citrus `#FF9F1C`, Sea `#5CB3FF`, Gelato `#FFE680`, Amalfi `#1F55C9`, Ink `#172B70`); Tomato is NOT offered as an accent (tomato is reserved for primary actions and hearts). Add a helper `albumAccent(hex) -> { hex, ink }` in a new `constants/albumAccents.js` (ink `#FFFFFF` for Amalfi and Ink, else `#172B70`), moving `PALETTE_ACCENTS`, `LEGACY_ACCENTS`, `displayAccent` out of `MemoriesPage.jsx`.
- Backend default changed to Citrus `"#FF9F1C"` so new albums are not legacy; no data migration (legacy hexes keep being mapped on read, and the album form already normalises on edit).
- Because legacy albums all map to Citrus: when an album has a legacy hex, map them to DIFFERENT palette colours by hashing the folder id into the 5 swatches ONLY IF the stored hex is one of the legacy values (so the grid is colourful instead of all orange). Persisting is not done; the next edit saves a real palette value.
- States: loading skeleton uses neutral `--sea-tint`; empty album: cover shows accent tint + doodle; error: unchanged; disabled: n/a. Dark mode (commit 03): tint mixes against `--white` token so they follow the theme; `--album-accent-ink` stays as computed.
- Phone 390px: grid is 1 column (`minmax(260px,1fr)`), shadows 6px stay inside the 16px gutter (check no horizontal scroll from the shadow).
- Motion: card hover keeps the existing 0.15s translate; changing the accent in the form previews live in a small mini-card inside the modal (new `AlbumAccentPreview`, 120ms colour transition, none on reduced motion).

## 3. Files to change / add
Frontend:
- CHANGE `fsp_frontend/src/components/layout/Navbar/Navbar.jsx`: route both sign-out entry points through one `ConfirmDialog`.
- CHANGE `fsp_frontend/src/components/admin/AdminLayout.jsx` and `fsp_frontend/src/components/admin/Sidebar.jsx`: use the same confirm (admin logout).
- ADD `fsp_frontend/src/components/layout/LogoutConfirm/LogoutConfirm.jsx`: the shared dialog (props `open`, `onClose`), reads `useAuth().logout`.
- CHANGE `fsp_frontend/src/components/memories/CalendarDump/CalendarView.jsx`: `onclone`, blur, toasts, `exporting` class.
- CHANGE `fsp_frontend/src/components/memories/CalendarDump/CalendarView.module.css`: `.calendarSheet.exporting ...` rules.
- CHANGE `fsp_frontend/src/pages/MemoriesPage.jsx`: use `--album-accent` on cards, header band, selected states; import accent helper; live preview in the album modal.
- CHANGE `fsp_frontend/src/pages/MemoriesPage.module.css`: `.folderCard`, `.cover`, `.albumHeader`, `.accentBar`, selected-photo styles read the variable.
- ADD `fsp_frontend/src/constants/albumAccents.js`: palette, legacy map, `albumAccent()`, deterministic legacy remap.
Backend:
- CHANGE `fsp_backend/src/main/java/com/forsneakypea/fspbackend/dto/FolderRequestDTO.java`, `entity/MemoryFolder.java`, `service/MemoryService.java`: default accent `"#FF9F1C"` instead of `"#C73616"` (three places, line ~21, ~32, ~78).

## 4. Data
No Flyway migration. Storage unchanged (`accent_color` varchar(20), ~9 bytes/album). Nothing to estimate: 0 bytes added per 1,000 items.

## 5. API
No new endpoints. `POST/PUT /api/v1/memories/folders` already accept `{ "accentColor": "#5CB3FF" }`; response `FolderDTO.accentColor` unchanged. Server-side validation to add in `MemoryService`: accept only `^#[0-9A-Fa-f]{6}$` else `400 {"success":false,"message":"Pick one of the album colours."}`; the five palette values are not enforced server-side (legacy values must still load).

## 6. Edge cases and risks
- Two people editing the same album: last write wins on `accentColor`; the other tab picks it up on the next `folders` query refetch (staleTime 30s). Acceptable.
- Logout while an upload/export is running: the dialog message stays the same; the in-flight request is cancelled by the page unmount. Do not block logout.
- Logout in two tabs: `AuthProvider` clears the query client; the second tab's next 401 redirects to `/auth`.
- PNG: `onclone` runs on a clone, so images (Drive signed URLs, `useCORS:true`) behave as before; if an image fails CORS, html2canvas draws it blank (existing behaviour). Large months at scale 3 can use ~100+ MB on low-end phones: keep the scale but catch the error and retry once at scale 2.
- Legacy remap by id hash: only for legacy hexes, deterministic (same album always same colour), never written back.
- Gelato accent: ensure the card shadow is visible on `--paper` (it is, because the 2px ink border carries the shape); header band at 22% gelato is intentionally subtle.
- "Delete all" for memories: unaffected.

## 7. Acceptance checklist
- [ ] 390px: avatar menu -> Sign out -> "Leave for now?" opens centered, no horizontal scroll; "Stay" keeps session; "Leave" signs out.
- [ ] Desktop: navbar sign-out icon opens the same dialog; admin sidebar/top bar sign-out also asks.
- [ ] Dark mode (after commit 03): dialog readable; exported PNG still light.
- [ ] Keyboard: Tab cycles inside the dialog, Esc closes, focus returns to the opener, Enter on "Leave" signs out.
- [ ] Screen reader: dialog announced as "Leave for now?" with the message; buttons named "Stay" / "Leave".
- [ ] Reduced motion: no new animations; accent preview swaps instantly.
- [ ] Export PNG: open the current month while "today" is in it, hover a day, tab-focus a day, export: no today ring, no caption, no focus ring.
- [ ] Create albums in all 5 accents: each card, header band and selected photo shows that colour; editing the accent updates all three after save.
- [ ] Old albums (legacy hex) show varied palette colours, not all orange.
- [ ] "Delete all" memories still works.

# FILES I WILL PASTE BELOW
Frontend (shared, to reuse):
- fsp_frontend/src/components/ui/ConfirmDialog/ConfirmDialog.jsx and ConfirmDialog.module.css
- fsp_frontend/src/components/ui/Modal/Modal.jsx and Modal.module.css
- fsp_frontend/src/components/ui/Button/Button.jsx and Button.module.css
- fsp_frontend/src/components/ui/RadioGroup/RadioGroup.jsx and RadioGroup.module.css (ColorSwatchGroup)
- fsp_frontend/src/components/Icon/Icon.jsx
- fsp_frontend/src/styles/design-tokens.css
Frontend (to change):
- fsp_frontend/src/components/layout/Navbar/Navbar.jsx and Navbar.module.css
- fsp_frontend/src/components/admin/AdminLayout.jsx
- fsp_frontend/src/components/admin/Sidebar.jsx
- fsp_frontend/src/context/AuthProvider.jsx
- fsp_frontend/src/hooks/useAuth.js
- fsp_frontend/src/components/memories/CalendarDump/CalendarView.jsx and CalendarView.module.css
- fsp_frontend/src/pages/MemoriesPage.jsx and MemoriesPage.module.css
- fsp_frontend/src/hooks/useNotification.js
Backend (to change):
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/dto/FolderRequestDTO.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/entity/MemoryFolder.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/service/MemoryService.java

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
