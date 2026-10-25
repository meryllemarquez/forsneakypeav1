# 03 · Dark mode everywhere (Light / Dark / System)

## 1. Goal and user flow
A complete dark theme with the same personality: **navy night, warm glows, softer ink**. Three choices: Light, Dark, System. Remembered per device (localStorage) and per user (one small column, synced when signed in). Exports (Calendar PNG, later the Bouquet PNG) stay light.

**Flow.** (phone) tap avatar -> menu -> a "Theme" row with a 3-way segmented control (Light / Dark / System) -> the whole app cross-fades into the new theme in ~250ms. (anywhere) Profile -> Appearance card -> "Theme" `RadioGroup` (same three options, with a mini preview tile each). First visit with no choice: System. Signed-out `/auth` landing follows the device choice (night sky, glowing window, fireflies in dark).

## 2. UX spec

### Mechanics
- Attribute on `<html>`: `data-theme="light" | "dark"` (the RESOLVED theme) plus `data-theme-pref="light" | "dark" | "system"`. A tiny inline script in `index.html` `<head>` (before CSS) reads `localStorage['fsp-theme']` (`light|dark|system`), resolves `system` with `matchMedia('(prefers-color-scheme: dark)')`, and sets both attributes immediately (no flash of the wrong theme). It also sets `<meta name="theme-color">` (light `#FFF8E8`, dark `#0E1533`) and `color-scheme` on `:root` (`light` / `dark`, so native date pickers, scrollbars and form controls follow).
- `context/ThemeProvider.jsx` + `hooks/useTheme.js` expose `{ pref, resolved, setPref }`. `setPref` writes localStorage, updates attributes, listens to the media query while `pref === 'system'`, and (if signed in) calls `PUT /api/v1/profile/theme` in the background (debounced 500ms; failure is silent, localStorage still wins on this device). On login, if the server has a `themePref` and localStorage has none, adopt the server value; if both exist, **this device's value wins** (so a phone can differ from a laptop) and nothing is overwritten.
- Transition: add class `theme-fading` on `<html>` for 250ms that sets `transition: background-color .25s ease, color .25s ease, border-color .25s ease, box-shadow .25s ease` on `body, *`; remove after. Reduced motion: no transition (instant).

### Token architecture
- `design-tokens.css`: keep the existing names for light. Add `:root[data-theme="dark"] { ... }` overriding the same tokens (so every component that already uses `var(--ink)`, `var(--white)`, `var(--paper)` just works). Because `--ink` is used both as text colour and as OUTLINE/SHADOW colour, introduce `--outline` (light = `var(--ink)`, dark = softer navy-lilac) and migrate borders/shadows in shared components to `--outline`; text stays `--ink`.
- New semantic tokens (defined in both themes): `--surface` (cards; = `--white` in light), `--surface-sunk`, `--outline`, `--shadow-sea` (the coloured offset shadow), `--on-tomato` (text on tomato buttons), `--icon-ink` (doodle outline), `--scrim` (modal backdrop), `--glow` (warm glow), `--link`, `--success-bg`, `--danger-bg`. Remove the legacy alias block only if every consumer is migrated; otherwise redirect legacy aliases to the new tokens (they already point at base tokens, so they follow automatically).
- **Proposed dark values** (verify every text/background pair >= 4.5:1 with a throwaway script and record the table in `docs/dark-mode-contrast.md`; adjust if a pair fails):
  | Token | Light | Dark |
  |---|---|---|
  | `--paper` | `#FFF8E8` | `#0E1533` |
  | `--white` / `--surface` | `#FFFFFF` | `#19224D` |
  | `--surface-sunk` | `#FFF0B3` area tints | `#131B40` |
  | `--ink` (text) | `#172B70` | `#DCE5FF` |
  | `--ink-soft` | `#3A4A73` | `#B4C2EE` |
  | `--ink-muted` | `#4A5A80` | `#97A8DB` |
  | `--outline` | `#172B70` | `#6F83CE` |
  | `--line-soft` | `#C9D6EC` | `#2E3C73` |
  | `--sea` | `#5CB3FF` | `#5CB3FF` |
  | `--sea-tint` | `#CDE7FF` | `#1B3466` |
  | `--shadow-sea` | `#5CB3FF` | `#2A4FA8` |
  | `--citrus` | `#FF9F1C` | `#FFAE3D` |
  | `--citrus-tint` / `--citrus-cover` | `#FFD8A0` / `#FFC76B` | `#4A3A22` / `#7A5320` |
  | `--gelato` | `#FFE680` | `#FFE680` (stays: it reads as a lit lamp/note) |
  | `--gelato-tint` | `#FFF0B3` | `#4A4420` |
  | `--amalfi` / `--link` | `#1F55C9` | `#8DB2FF` |
  | `--amalfi-tint` | `#CBDBF8` | `#22346B` |
  | `--tomato` | `#E0301A` | `#FF5A44` |
  | `--on-tomato` | `#FFFFFF` | `#0E1533` |
  | `--footer-ink` | `#E3EEFF` | `#E3EEFF` (the footer gets its own `--footer-bg` token: light `#1F55C9`, dark `#12307A`) |
  | `--paper-warm` | `#FFFDF6` | `#121A3E` |
  | `--glow` | n/a | `#FFD27A` |
  | `--scrim` | `rgb(23 43 112 / .5)` | `rgb(5 8 24 / .66)` |
  | `--icon-ink` | `#172B70` | `#E8EEFF` |
- Rules kept in dark: tomato only for primary actions and hearts; text never on busy patterns (the dotted paper pattern gets `rgb(220 229 255 / .07)` in dark); one sticker cluster per screen; focus ring `3px solid var(--tomato)` still visible (tomato `#FF5A44` on navy is 4.9:1).

### Doodle icons in dark
`Icon.jsx` hard-codes `stroke="#172B70"` and `glyphs.jsx` has ~215 literal hex values, many `#172B70` fills (dots, eyes, details). Plan: in `Icon.jsx` set the `<svg>` `stroke="currentColor"` and `style={{ color: 'var(--icon-ink)' }}`; in `glyphs.jsx` replace every literal `#172B70` (stroke or fill) with `currentColor` (do this by a mechanical search/replace; `glyphs.jsx` is hand-edited, so do NOT regenerate it from `Icon.dc.html`). Coloured flat fills (sea, citrus, tomato, gelato, white) stay. `sticker` icons keep their white (`--surface`) plate; in dark that plate becomes `--surface` with `--outline` ring, and glyph strokes use `--icon-ink`. Check every glyph visually at 24/48/96px on `#19224D`: any pure `#FFFFFF` fill that looks too stark becomes `var(--icon-white)` (`#FFFFFF` light, `#F2F5FF` dark). The `her`/`him` skin tones, plushies and Motmot red must stay recognisable.

### Per-surface notes
- **Landing / Auth** (`LandingScene.jsx` ~100 literals, `LandingScene.module.css`, `AuthPage.module.css`): a night version of the scene driven by CSS variables on the scene root: sky gradient `#0E1533 -> #1B2A66 -> #3A3F85`, stars (tiny twinkle, 3-5s, off on reduced motion), a moon replacing the sun, **the house window glows** `--glow` `#FFD27A` with a soft 6px blur halo, 12-16 **fireflies** (small `--glow` dots drifting on sine paths 8-14s, `opacity .3 <-> 1`, hidden on reduced motion), clouds recoloured `#2B3A7A` at 0.7 opacity, hills `#16224F/#1D2C63`, ground `#1A2650`. Characters (Motmot, Skyrie, Rorry, dogs) keep ink outlines via `--icon-ink` light. Parallax unchanged. Login card = `--surface`.
- **Navbar / TabBar / Footer**: nav pill `--surface`, active tab `--user-accent` (accent colours stay; `--user-accent-ink` already provides the right text colour), avatar ring unchanged. Footer background `#12307A` with `--footer-ink` text; its white pattern overlays drop to `.06` alpha.
- **Home**: hero plate, sticker cluster, polaroids (frames stay light paper `#FFF8E8` with ink text since they are physical photos), cards on `--surface`, outline `--outline`, offset shadow `--shadow-sea`. Dotted background pattern recoloured (`HomePage.module.css` lines ~6, 152-155, 311, 484, 492, 496, 553-554 hold literals).
- **Memories**: album cards `--surface`; cover placeholders mix with `--surface`; lightbox is already dark (`#141210` -> `#070B1E`); filter chips, calendar sheet (follows the theme on screen; the **export** forces light), day cells use `--surface`, today ring `--citrus`.
- **Dates**: status chips (`StatusChip.module.css`) need dark pairs; category colours coming from the API (`categoryColorHex`) are user data: keep them but place text on a `--surface` plate. Grid background lines `rgb(92 179 255 / .3)` -> `.18` in dark.
- **Love Board**: the wall/room and chrome follow the theme (`--paper-warm`, board frame). **Notes, papers, tapes, pins and stickers stay light physical objects**: do not recolour `lbGraphics.module.css` papers (gelato/sea/citrus/lined/grid/torn). Note shadows `rgba(23,43,112,.3)` become `rgba(0,0,0,.45)` in dark. Text colour swatches (`FONT_COLOR_SWATCHES`) and `noteCanvas` default `#2b2b2b` are paper-on-text and stay. Tailwind class strings (46 occurrences of `bg-white`, `text-white`, `bg-[#...]`, `border-[#...]` in 14 files: `ArchiveDrawer`, `CollapsibleSection`, `lbUi`, `AttachmentHandle`, `NoteCanvasEditor`, `PaperPicker`, `TextBoxHandle`, `CorkBoard`, `LayerPanel`, `Sticker`, `BoardMenu`, `BoardToolbar`, `SearchFilterPanel`, `LoveLettersPage`) migrate to token utilities: define in `loveboard-tailwind.css` `@theme` colours `--color-lb-surface: var(--surface)`, `--color-lb-text: var(--ink)`, etc., and replace `bg-white` -> `bg-(--surface)`, `text-white` -> `text-(--on-tomato)` or `text-(--ink)` depending on the background.
- **Profile**: cards on `--surface`; accent swatches unchanged; avatar crop modal (`AvatarCropModal.module.css`) uses tokens.
- **Admin** (`admin-tailwind.css` already maps `--color-admin-*` to the shared tokens, so most flows follow automatically); fix `--color-admin-text-faint: #5b6a8f` (add a dark value `#8392C4`), the sidebar (`--color-admin-sidebar: var(--ink)` would become LIGHT in dark: override with `#0A1030`), and `Sidebar.jsx` `bg-white` text. Tables stripe with `--surface-sunk`.
- **Modals, drawers, popovers, toasts, ConfirmDialog, DeleteAllDialog, notification panel/bell**: `Modal.module.css` (backdrop `rgb(23 43 112 / .5)` -> `--scrim`), `Notifications.module.css` (`.45` overlay), `Notification.module.css` (`rgb(23 43 112 / .1)` dismiss hover; toast backgrounds per type must have dark variants: info `--sea-tint`, success `--citrus-tint`/`gelato`, gold `--gelato-tint`, error `--citrus-tint` with citrus badge).
- **Forms and pickers**: `FormControls.module.css` inputs `--surface` bg, `--outline` border, placeholder `--ink-muted`, `::selection` `--sea-tint`; native `<input type=date/time>` and `<select>` follow `color-scheme`. `DatePicker`, `Select` chevrons use `currentColor`. `RadioGroup` selected ring uses `box-shadow: 0 0 0 3px var(--surface), 0 0 0 5px var(--outline)`. `Chip`, `Tabs`, `StatusChip` need dark pairs verified.
- **Misc**: `ProtectedRoute.jsx` has an inline `color: var(--color-brown-primary, #4a2c2a)` (dead brown token): switch to `var(--ink)`. `ErrorBoundary`, `PageLoader` use dotted bg patterns (recolour). `CalendarView.jsx` `backgroundColor: '#FFF8E8'` stays (export is light).
- **Exports stay light**: the Calendar PNG export sets `data-theme="light"` on the html2canvas clone (and the light token values apply), so a dark-theme user still exports a cream sheet. Same rule for the Bouquet export in commit 06.

### Toggle UI
- Component `ui/ThemeToggle/ThemeToggle.jsx`: a 3-option `RadioGroup variant="tile"` labelled "Theme" with doodle icons (`sun` for Light, a new crescent-moon glyph `moon` for Dark (add to Icon kit: 64x64, crescent in `--gelato` with ink stroke and two tiny `sparkle` dots), and for System a half-sun/half-moon built from `sun` + `moon` at 60% size). Phone avatar menu variant is compact: three 44px icon-only radios in a row with `aria-label`s "Light", "Dark", "Match my phone".
- Profile -> Appearance: add the card row above accent colour with copy **"Theme"** and sub-line (Caveat) **"Lights on, or lights off?"**; a live preview mini-card (`paper` + `surface` swatches) per option.
- Toast on change: none (the change itself is the feedback). Announce `aria-live="polite"` "Dark theme on".
- Desktop: keep it in Profile plus a small `IconButton` (sun/moon toggle cycling Light -> Dark -> System) in the navbar `right` cluster at >= 900px.
- Keyboard: arrow keys move between options (RadioGroup behaviour); Space/Enter selects.

## 3. Files to change / add
Frontend:
- CHANGE `fsp_frontend/index.html`: pre-paint theme script, `color-scheme`, `theme-color` meta.
- CHANGE `fsp_frontend/src/styles/design-tokens.css`: new semantic tokens + `[data-theme="dark"]` block; migrate legacy aliases.
- CHANGE `fsp_frontend/src/styles/reset.css`: `color-scheme`, selection, scrollbar, `theme-fading` transition, `body` bg from `--paper`.
- ADD `fsp_frontend/src/context/ThemeProvider.jsx` and `fsp_frontend/src/context/ThemeContext.js`, `fsp_frontend/src/hooks/useTheme.js`: state + persistence.
- CHANGE `fsp_frontend/src/main.jsx` / `App.jsx`: wrap with `ThemeProvider`.
- ADD `fsp_frontend/src/components/ui/ThemeToggle/ThemeToggle.jsx` + `.module.css`.
- CHANGE `fsp_frontend/src/components/Icon/Icon.jsx`, `glyphs.jsx` (add `moon`; `#172B70` -> `currentColor`).
- CHANGE `fsp_frontend/src/components/layout/Navbar/Navbar.jsx` + `.module.css` (avatar menu theme row, desktop toggle), `TabBar.module.css`, `Footer.module.css`, `Logo.module.css`.
- CHANGE `fsp_frontend/src/pages/ProfilePage.jsx` + `.module.css` (Appearance theme card), `HomePage.module.css`, `MemoriesPage.module.css`, `DatesPage.module.css`, `AuthPage.module.css`.
- CHANGE `fsp_frontend/src/components/landing/LandingScene.jsx` + `.module.css`: night scene with CSS variables (window glow, fireflies, stars, moon).
- CHANGE every shared `components/ui/*/*.module.css` (Button, Chip, ConfirmDialog, DatePicker, DeleteAllDialog, FormControls, IconButton, Modal, RadioGroup, Select, StatusChip, Tabs) to semantic tokens.
- CHANGE `fsp_frontend/src/components/common/Notification/Notification.module.css`, `components/notifications/Notifications.module.css`, `common/ErrorBoundary/*.css`, `common/PageLoader/*.css`.
- CHANGE Love Board: `styles/loveboard-tailwind.css`, `components/loveBoard/common/lbGraphics.module.css` (shadows only), `lbUi.jsx` and the 13 other files with Tailwind colour literals listed above; `pages/LoveLettersPage.jsx`.
- CHANGE Admin: `styles/admin-tailwind.css`, `components/admin/Sidebar.jsx`.
- CHANGE `fsp_frontend/src/components/memories/CalendarDump/CalendarView.jsx` + `.module.css`: export clone forced light.
- CHANGE `fsp_frontend/src/components/ProtectedRoute.jsx`: remove the dead brown token.
- CHANGE `fsp_frontend/src/services/profileService.js` and `queries/mutations.js`: `updateTheme`.
- ADD `docs/dark-mode-contrast.md`: the checked contrast table.
Backend:
- ADD `fsp_backend/src/main/resources/db/migration/V4__user_theme_pref.sql`.
- CHANGE `entity/User.java` (`themePref`), `dto/ProfileDTO.java`, `dto/response/AuthResponse.java` (include `themePref`), `service/ProfileService.java` (`updateTheme`), `controller/ProfileController.java` (`PUT /theme`).

## 4. Data
Flyway `V4__user_theme_pref.sql`:
```sql
-- V4: remember each person's theme choice across devices (light | dark | system).
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_pref varchar(8) NOT NULL DEFAULT 'system';
ALTER TABLE users ADD CONSTRAINT users_theme_pref_chk CHECK (theme_pref IN ('light','dark','system'));
```
Entity: `@Column(name = "theme_pref", length = 8, nullable = false) private String themePref = "system";`. DTO: `ProfileDTO.themePref`, `AuthResponse` carries it so the client can adopt it on login.
Storage: 8 bytes per user x 3 users. Per 1,000 users: ~8 KB (irrelevant; only 2-3 real users).

## 5. API
`PUT /api/v1/profile/theme` · `ROLE_USER` (SecurityConfig already requires `ROLE_USER` for `/api/v1/profile/**`; admin keeps localStorage only).
Request `{ "themePref": "dark" }` -> `200 { "themePref": "dark" }`. Errors: `400 {"success":false,"message":"Theme must be light, dark or system."}`, `401`.
Existing `GET /api/v1/profile` and the login response gain `"themePref": "system"`.

## 6. Edge cases and risks
- **Flash of wrong theme**: solved by the inline script; verify with a throttled CPU and hard reload.
- **System changes while open**: listen to `matchMedia` change events only when `pref === 'system'`.
- **Two devices, two choices**: device value wins; server value is the default for a new device only.
- **Two tabs**: `storage` event syncs the other tab.
- **User-chosen colours in dark**: accent (`ACCENT_COLORS`), album accents, date category hexes, Love Board text colours are user data; keep them but guarantee text contrast via their `ink` pairs and plates. Ink-coloured album accent `#172B70` on a navy card would vanish: when the accent is `Ink` in dark, draw it with `--icon-ink` outline or swap to `#DCE5FF` (`albumAccent()` takes the theme).
- **Images**: photos never get filtered. No `filter: invert()` hacks anywhere.
- **Print/PNG**: exports forced light (see above).
- **Contrast failures**: any pair < 4.5:1 is fixed by changing the dark token, not by special-casing a component.
- **Old data**: nothing stored besides `theme_pref`; the migration is idempotent.
- **Deleting**: "delete all" flows have no theme interplay; verify dialogs in dark.

## 7. Acceptance checklist
- [ ] 390px light and dark: every page (`/auth`, `/home`, `/memories` albums + gallery + calendar, `/dates`, `/letters`, `/profile`, `/admin/*`) has no white flash, no invisible text, no unreadable icon.
- [ ] Toggle in avatar menu and Profile works, persists after reload and on another device (after login).
- [ ] System mode follows the OS toggle live.
- [ ] Contrast: all text/background pairs >= 4.5:1 (table committed); focus ring visible in both themes.
- [ ] Landing in dark: night sky, glowing window, fireflies; reduced motion shows a static night scene.
- [ ] Love Board papers/stickers stay light; board wall is dark; PNG exports stay light.
- [ ] Modals, date/time pickers, selects, toasts, notification panel readable in dark.
- [ ] Keyboard: toggle reachable and operable; screen reader announces the selected theme.
- [ ] Reduced motion: no theme-fade, no stars/fireflies motion.
- [ ] "Delete all" dialogs (memories, dates, love board) look right in dark.

## 8. Commit title
`Dark mode: Light/Dark/System theme with night-time landing, token-driven palette and per-user preference`

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

# FEATURE SPEC (03 · Dark mode everywhere (Light / Dark / System))

## 1. Goal and user flow
A complete dark theme with the same personality: **navy night, warm glows, softer ink**. Three choices: Light, Dark, System. Remembered per device (localStorage) and per user (one small column, synced when signed in). Exports (Calendar PNG, later the Bouquet PNG) stay light.

**Flow.** (phone) tap avatar -> menu -> a "Theme" row with a 3-way segmented control (Light / Dark / System) -> the whole app cross-fades into the new theme in ~250ms. (anywhere) Profile -> Appearance card -> "Theme" `RadioGroup` (same three options, with a mini preview tile each). First visit with no choice: System. Signed-out `/auth` landing follows the device choice (night sky, glowing window, fireflies in dark).

## 2. UX spec

### Mechanics
- Attribute on `<html>`: `data-theme="light" | "dark"` (the RESOLVED theme) plus `data-theme-pref="light" | "dark" | "system"`. A tiny inline script in `index.html` `<head>` (before CSS) reads `localStorage['fsp-theme']` (`light|dark|system`), resolves `system` with `matchMedia('(prefers-color-scheme: dark)')`, and sets both attributes immediately (no flash of the wrong theme). It also sets `<meta name="theme-color">` (light `#FFF8E8`, dark `#0E1533`) and `color-scheme` on `:root` (`light` / `dark`, so native date pickers, scrollbars and form controls follow).
- `context/ThemeProvider.jsx` + `hooks/useTheme.js` expose `{ pref, resolved, setPref }`. `setPref` writes localStorage, updates attributes, listens to the media query while `pref === 'system'`, and (if signed in) calls `PUT /api/v1/profile/theme` in the background (debounced 500ms; failure is silent, localStorage still wins on this device). On login, if the server has a `themePref` and localStorage has none, adopt the server value; if both exist, **this device's value wins** (so a phone can differ from a laptop) and nothing is overwritten.
- Transition: add class `theme-fading` on `<html>` for 250ms that sets `transition: background-color .25s ease, color .25s ease, border-color .25s ease, box-shadow .25s ease` on `body, *`; remove after. Reduced motion: no transition (instant).

### Token architecture
- `design-tokens.css`: keep the existing names for light. Add `:root[data-theme="dark"] { ... }` overriding the same tokens (so every component that already uses `var(--ink)`, `var(--white)`, `var(--paper)` just works). Because `--ink` is used both as text colour and as OUTLINE/SHADOW colour, introduce `--outline` (light = `var(--ink)`, dark = softer navy-lilac) and migrate borders/shadows in shared components to `--outline`; text stays `--ink`.
- New semantic tokens (defined in both themes): `--surface` (cards; = `--white` in light), `--surface-sunk`, `--outline`, `--shadow-sea` (the coloured offset shadow), `--on-tomato` (text on tomato buttons), `--icon-ink` (doodle outline), `--scrim` (modal backdrop), `--glow` (warm glow), `--link`, `--success-bg`, `--danger-bg`. Remove the legacy alias block only if every consumer is migrated; otherwise redirect legacy aliases to the new tokens (they already point at base tokens, so they follow automatically).
- **Proposed dark values** (verify every text/background pair >= 4.5:1 with a throwaway script and record the table in `docs/dark-mode-contrast.md`; adjust if a pair fails):
  | Token | Light | Dark |
  |---|---|---|
  | `--paper` | `#FFF8E8` | `#0E1533` |
  | `--white` / `--surface` | `#FFFFFF` | `#19224D` |
  | `--surface-sunk` | `#FFF0B3` area tints | `#131B40` |
  | `--ink` (text) | `#172B70` | `#DCE5FF` |
  | `--ink-soft` | `#3A4A73` | `#B4C2EE` |
  | `--ink-muted` | `#4A5A80` | `#97A8DB` |
  | `--outline` | `#172B70` | `#6F83CE` |
  | `--line-soft` | `#C9D6EC` | `#2E3C73` |
  | `--sea` | `#5CB3FF` | `#5CB3FF` |
  | `--sea-tint` | `#CDE7FF` | `#1B3466` |
  | `--shadow-sea` | `#5CB3FF` | `#2A4FA8` |
  | `--citrus` | `#FF9F1C` | `#FFAE3D` |
  | `--citrus-tint` / `--citrus-cover` | `#FFD8A0` / `#FFC76B` | `#4A3A22` / `#7A5320` |
  | `--gelato` | `#FFE680` | `#FFE680` (stays: it reads as a lit lamp/note) |
  | `--gelato-tint` | `#FFF0B3` | `#4A4420` |
  | `--amalfi` / `--link` | `#1F55C9` | `#8DB2FF` |
  | `--amalfi-tint` | `#CBDBF8` | `#22346B` |
  | `--tomato` | `#E0301A` | `#FF5A44` |
  | `--on-tomato` | `#FFFFFF` | `#0E1533` |
  | `--footer-ink` | `#E3EEFF` | `#E3EEFF` (the footer gets its own `--footer-bg` token: light `#1F55C9`, dark `#12307A`) |
  | `--paper-warm` | `#FFFDF6` | `#121A3E` |
  | `--glow` | n/a | `#FFD27A` |
  | `--scrim` | `rgb(23 43 112 / .5)` | `rgb(5 8 24 / .66)` |
  | `--icon-ink` | `#172B70` | `#E8EEFF` |
- Rules kept in dark: tomato only for primary actions and hearts; text never on busy patterns (the dotted paper pattern gets `rgb(220 229 255 / .07)` in dark); one sticker cluster per screen; focus ring `3px solid var(--tomato)` still visible (tomato `#FF5A44` on navy is 4.9:1).

### Doodle icons in dark
`Icon.jsx` hard-codes `stroke="#172B70"` and `glyphs.jsx` has ~215 literal hex values, many `#172B70` fills (dots, eyes, details). Plan: in `Icon.jsx` set the `<svg>` `stroke="currentColor"` and `style={{ color: 'var(--icon-ink)' }}`; in `glyphs.jsx` replace every literal `#172B70` (stroke or fill) with `currentColor` (do this by a mechanical search/replace; `glyphs.jsx` is hand-edited, so do NOT regenerate it from `Icon.dc.html`). Coloured flat fills (sea, citrus, tomato, gelato, white) stay. `sticker` icons keep their white (`--surface`) plate; in dark that plate becomes `--surface` with `--outline` ring, and glyph strokes use `--icon-ink`. Check every glyph visually at 24/48/96px on `#19224D`: any pure `#FFFFFF` fill that looks too stark becomes `var(--icon-white)` (`#FFFFFF` light, `#F2F5FF` dark). The `her`/`him` skin tones, plushies and Motmot red must stay recognisable.

### Per-surface notes
- **Landing / Auth** (`LandingScene.jsx` ~100 literals, `LandingScene.module.css`, `AuthPage.module.css`): a night version of the scene driven by CSS variables on the scene root: sky gradient `#0E1533 -> #1B2A66 -> #3A3F85`, stars (tiny twinkle, 3-5s, off on reduced motion), a moon replacing the sun, **the house window glows** `--glow` `#FFD27A` with a soft 6px blur halo, 12-16 **fireflies** (small `--glow` dots drifting on sine paths 8-14s, `opacity .3 <-> 1`, hidden on reduced motion), clouds recoloured `#2B3A7A` at 0.7 opacity, hills `#16224F/#1D2C63`, ground `#1A2650`. Characters (Motmot, Skyrie, Rorry, dogs) keep ink outlines via `--icon-ink` light. Parallax unchanged. Login card = `--surface`.
- **Navbar / TabBar / Footer**: nav pill `--surface`, active tab `--user-accent` (accent colours stay; `--user-accent-ink` already provides the right text colour), avatar ring unchanged. Footer background `#12307A` with `--footer-ink` text; its white pattern overlays drop to `.06` alpha.
- **Home**: hero plate, sticker cluster, polaroids (frames stay light paper `#FFF8E8` with ink text since they are physical photos), cards on `--surface`, outline `--outline`, offset shadow `--shadow-sea`. Dotted background pattern recoloured (`HomePage.module.css` lines ~6, 152-155, 311, 484, 492, 496, 553-554 hold literals).
- **Memories**: album cards `--surface`; cover placeholders mix with `--surface`; lightbox is already dark (`#141210` -> `#070B1E`); filter chips, calendar sheet (follows the theme on screen; the **export** forces light), day cells use `--surface`, today ring `--citrus`.
- **Dates**: status chips (`StatusChip.module.css`) need dark pairs; category colours coming from the API (`categoryColorHex`) are user data: keep them but place text on a `--surface` plate. Grid background lines `rgb(92 179 255 / .3)` -> `.18` in dark.
- **Love Board**: the wall/room and chrome follow the theme (`--paper-warm`, board frame). **Notes, papers, tapes, pins and stickers stay light physical objects**: do not recolour `lbGraphics.module.css` papers (gelato/sea/citrus/lined/grid/torn). Note shadows `rgba(23,43,112,.3)` become `rgba(0,0,0,.45)` in dark. Text colour swatches (`FONT_COLOR_SWATCHES`) and `noteCanvas` default `#2b2b2b` are paper-on-text and stay. Tailwind class strings (46 occurrences of `bg-white`, `text-white`, `bg-[#...]`, `border-[#...]` in 14 files: `ArchiveDrawer`, `CollapsibleSection`, `lbUi`, `AttachmentHandle`, `NoteCanvasEditor`, `PaperPicker`, `TextBoxHandle`, `CorkBoard`, `LayerPanel`, `Sticker`, `BoardMenu`, `BoardToolbar`, `SearchFilterPanel`, `LoveLettersPage`) migrate to token utilities: define in `loveboard-tailwind.css` `@theme` colours `--color-lb-surface: var(--surface)`, `--color-lb-text: var(--ink)`, etc., and replace `bg-white` -> `bg-(--surface)`, `text-white` -> `text-(--on-tomato)` or `text-(--ink)` depending on the background.
- **Profile**: cards on `--surface`; accent swatches unchanged; avatar crop modal (`AvatarCropModal.module.css`) uses tokens.
- **Admin** (`admin-tailwind.css` already maps `--color-admin-*` to the shared tokens, so most flows follow automatically); fix `--color-admin-text-faint: #5b6a8f` (add a dark value `#8392C4`), the sidebar (`--color-admin-sidebar: var(--ink)` would become LIGHT in dark: override with `#0A1030`), and `Sidebar.jsx` `bg-white` text. Tables stripe with `--surface-sunk`.
- **Modals, drawers, popovers, toasts, ConfirmDialog, DeleteAllDialog, notification panel/bell**: `Modal.module.css` (backdrop `rgb(23 43 112 / .5)` -> `--scrim`), `Notifications.module.css` (`.45` overlay), `Notification.module.css` (`rgb(23 43 112 / .1)` dismiss hover; toast backgrounds per type must have dark variants: info `--sea-tint`, success `--citrus-tint`/`gelato`, gold `--gelato-tint`, error `--citrus-tint` with citrus badge).
- **Forms and pickers**: `FormControls.module.css` inputs `--surface` bg, `--outline` border, placeholder `--ink-muted`, `::selection` `--sea-tint`; native `<input type=date/time>` and `<select>` follow `color-scheme`. `DatePicker`, `Select` chevrons use `currentColor`. `RadioGroup` selected ring uses `box-shadow: 0 0 0 3px var(--surface), 0 0 0 5px var(--outline)`. `Chip`, `Tabs`, `StatusChip` need dark pairs verified.
- **Misc**: `ProtectedRoute.jsx` has an inline `color: var(--color-brown-primary, #4a2c2a)` (dead brown token): switch to `var(--ink)`. `ErrorBoundary`, `PageLoader` use dotted bg patterns (recolour). `CalendarView.jsx` `backgroundColor: '#FFF8E8'` stays (export is light).
- **Exports stay light**: the Calendar PNG export sets `data-theme="light"` on the html2canvas clone (and the light token values apply), so a dark-theme user still exports a cream sheet. Same rule for the Bouquet export in commit 06.

### Toggle UI
- Component `ui/ThemeToggle/ThemeToggle.jsx`: a 3-option `RadioGroup variant="tile"` labelled "Theme" with doodle icons (`sun` for Light, a new crescent-moon glyph `moon` for Dark (add to Icon kit: 64x64, crescent in `--gelato` with ink stroke and two tiny `sparkle` dots), and for System a half-sun/half-moon built from `sun` + `moon` at 60% size). Phone avatar menu variant is compact: three 44px icon-only radios in a row with `aria-label`s "Light", "Dark", "Match my phone".
- Profile -> Appearance: add the card row above accent colour with copy **"Theme"** and sub-line (Caveat) **"Lights on, or lights off?"**; a live preview mini-card (`paper` + `surface` swatches) per option.
- Toast on change: none (the change itself is the feedback). Announce `aria-live="polite"` "Dark theme on".
- Desktop: keep it in Profile plus a small `IconButton` (sun/moon toggle cycling Light -> Dark -> System) in the navbar `right` cluster at >= 900px.
- Keyboard: arrow keys move between options (RadioGroup behaviour); Space/Enter selects.

## 3. Files to change / add
Frontend:
- CHANGE `fsp_frontend/index.html`: pre-paint theme script, `color-scheme`, `theme-color` meta.
- CHANGE `fsp_frontend/src/styles/design-tokens.css`: new semantic tokens + `[data-theme="dark"]` block; migrate legacy aliases.
- CHANGE `fsp_frontend/src/styles/reset.css`: `color-scheme`, selection, scrollbar, `theme-fading` transition, `body` bg from `--paper`.
- ADD `fsp_frontend/src/context/ThemeProvider.jsx` and `fsp_frontend/src/context/ThemeContext.js`, `fsp_frontend/src/hooks/useTheme.js`: state + persistence.
- CHANGE `fsp_frontend/src/main.jsx` / `App.jsx`: wrap with `ThemeProvider`.
- ADD `fsp_frontend/src/components/ui/ThemeToggle/ThemeToggle.jsx` + `.module.css`.
- CHANGE `fsp_frontend/src/components/Icon/Icon.jsx`, `glyphs.jsx` (add `moon`; `#172B70` -> `currentColor`).
- CHANGE `fsp_frontend/src/components/layout/Navbar/Navbar.jsx` + `.module.css` (avatar menu theme row, desktop toggle), `TabBar.module.css`, `Footer.module.css`, `Logo.module.css`.
- CHANGE `fsp_frontend/src/pages/ProfilePage.jsx` + `.module.css` (Appearance theme card), `HomePage.module.css`, `MemoriesPage.module.css`, `DatesPage.module.css`, `AuthPage.module.css`.
- CHANGE `fsp_frontend/src/components/landing/LandingScene.jsx` + `.module.css`: night scene with CSS variables (window glow, fireflies, stars, moon).
- CHANGE every shared `components/ui/*/*.module.css` (Button, Chip, ConfirmDialog, DatePicker, DeleteAllDialog, FormControls, IconButton, Modal, RadioGroup, Select, StatusChip, Tabs) to semantic tokens.
- CHANGE `fsp_frontend/src/components/common/Notification/Notification.module.css`, `components/notifications/Notifications.module.css`, `common/ErrorBoundary/*.css`, `common/PageLoader/*.css`.
- CHANGE Love Board: `styles/loveboard-tailwind.css`, `components/loveBoard/common/lbGraphics.module.css` (shadows only), `lbUi.jsx` and the 13 other files with Tailwind colour literals listed above; `pages/LoveLettersPage.jsx`.
- CHANGE Admin: `styles/admin-tailwind.css`, `components/admin/Sidebar.jsx`.
- CHANGE `fsp_frontend/src/components/memories/CalendarDump/CalendarView.jsx` + `.module.css`: export clone forced light.
- CHANGE `fsp_frontend/src/components/ProtectedRoute.jsx`: remove the dead brown token.
- CHANGE `fsp_frontend/src/services/profileService.js` and `queries/mutations.js`: `updateTheme`.
- ADD `docs/dark-mode-contrast.md`: the checked contrast table.
Backend:
- ADD `fsp_backend/src/main/resources/db/migration/V4__user_theme_pref.sql`.
- CHANGE `entity/User.java` (`themePref`), `dto/ProfileDTO.java`, `dto/response/AuthResponse.java` (include `themePref`), `service/ProfileService.java` (`updateTheme`), `controller/ProfileController.java` (`PUT /theme`).

## 4. Data
Flyway `V4__user_theme_pref.sql`:
```sql
-- V4: remember each person's theme choice across devices (light | dark | system).
ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_pref varchar(8) NOT NULL DEFAULT 'system';
ALTER TABLE users ADD CONSTRAINT users_theme_pref_chk CHECK (theme_pref IN ('light','dark','system'));
```
Entity: `@Column(name = "theme_pref", length = 8, nullable = false) private String themePref = "system";`. DTO: `ProfileDTO.themePref`, `AuthResponse` carries it so the client can adopt it on login.
Storage: 8 bytes per user x 3 users. Per 1,000 users: ~8 KB (irrelevant; only 2-3 real users).

## 5. API
`PUT /api/v1/profile/theme` · `ROLE_USER` (SecurityConfig already requires `ROLE_USER` for `/api/v1/profile/**`; admin keeps localStorage only).
Request `{ "themePref": "dark" }` -> `200 { "themePref": "dark" }`. Errors: `400 {"success":false,"message":"Theme must be light, dark or system."}`, `401`.
Existing `GET /api/v1/profile` and the login response gain `"themePref": "system"`.

## 6. Edge cases and risks
- **Flash of wrong theme**: solved by the inline script; verify with a throttled CPU and hard reload.
- **System changes while open**: listen to `matchMedia` change events only when `pref === 'system'`.
- **Two devices, two choices**: device value wins; server value is the default for a new device only.
- **Two tabs**: `storage` event syncs the other tab.
- **User-chosen colours in dark**: accent (`ACCENT_COLORS`), album accents, date category hexes, Love Board text colours are user data; keep them but guarantee text contrast via their `ink` pairs and plates. Ink-coloured album accent `#172B70` on a navy card would vanish: when the accent is `Ink` in dark, draw it with `--icon-ink` outline or swap to `#DCE5FF` (`albumAccent()` takes the theme).
- **Images**: photos never get filtered. No `filter: invert()` hacks anywhere.
- **Print/PNG**: exports forced light (see above).
- **Contrast failures**: any pair < 4.5:1 is fixed by changing the dark token, not by special-casing a component.
- **Old data**: nothing stored besides `theme_pref`; the migration is idempotent.
- **Deleting**: "delete all" flows have no theme interplay; verify dialogs in dark.

## 7. Acceptance checklist
- [ ] 390px light and dark: every page (`/auth`, `/home`, `/memories` albums + gallery + calendar, `/dates`, `/letters`, `/profile`, `/admin/*`) has no white flash, no invisible text, no unreadable icon.
- [ ] Toggle in avatar menu and Profile works, persists after reload and on another device (after login).
- [ ] System mode follows the OS toggle live.
- [ ] Contrast: all text/background pairs >= 4.5:1 (table committed); focus ring visible in both themes.
- [ ] Landing in dark: night sky, glowing window, fireflies; reduced motion shows a static night scene.
- [ ] Love Board papers/stickers stay light; board wall is dark; PNG exports stay light.
- [ ] Modals, date/time pickers, selects, toasts, notification panel readable in dark.
- [ ] Keyboard: toggle reachable and operable; screen reader announces the selected theme.
- [ ] Reduced motion: no theme-fade, no stars/fireflies motion.
- [ ] "Delete all" dialogs (memories, dates, love board) look right in dark.

# FILES I WILL PASTE BELOW
Frontend (shared, to reuse and migrate):
- fsp_frontend/index.html
- fsp_frontend/src/main.jsx
- fsp_frontend/src/App.jsx
- fsp_frontend/src/styles/design-tokens.css
- fsp_frontend/src/styles/reset.css
- fsp_frontend/src/styles/fonts.css
- fsp_frontend/src/styles/admin-tailwind.css
- fsp_frontend/src/styles/loveboard-tailwind.css
- fsp_frontend/src/components/Icon/Icon.jsx and glyphs.jsx (large: paste the whole file)
- fsp_frontend/src/components/ui/Button/Button.module.css
- fsp_frontend/src/components/ui/Chip/Chip.module.css
- fsp_frontend/src/components/ui/ConfirmDialog/ConfirmDialog.module.css
- fsp_frontend/src/components/ui/DatePicker/DatePicker.module.css
- fsp_frontend/src/components/ui/DeleteAllDialog/DeleteAllDialog.module.css
- fsp_frontend/src/components/ui/FormControls.module.css
- fsp_frontend/src/components/ui/IconButton/IconButton.module.css
- fsp_frontend/src/components/ui/Modal/Modal.module.css
- fsp_frontend/src/components/ui/RadioGroup/RadioGroup.jsx and RadioGroup.module.css
- fsp_frontend/src/components/ui/Select/Select.module.css
- fsp_frontend/src/components/ui/StatusChip/StatusChip.module.css
- fsp_frontend/src/components/ui/Tabs/Tabs.module.css
- fsp_frontend/src/components/common/Notification/Notification.module.css
- fsp_frontend/src/components/notifications/Notifications.module.css
- fsp_frontend/src/components/common/ErrorBoundary/ErrorBoundary.module.css
- fsp_frontend/src/components/common/PageLoader/PageLoader.module.css
Frontend (layout and pages to change):
- fsp_frontend/src/components/layout/Navbar/Navbar.jsx and Navbar.module.css
- fsp_frontend/src/components/layout/TabBar/TabBar.module.css
- fsp_frontend/src/components/layout/Footer/Footer.module.css
- fsp_frontend/src/components/layout/Logo/Logo.module.css
- fsp_frontend/src/components/landing/LandingScene.jsx and LandingScene.module.css
- fsp_frontend/src/pages/AuthPage.module.css
- fsp_frontend/src/pages/HomePage.module.css
- fsp_frontend/src/pages/MemoriesPage.module.css
- fsp_frontend/src/pages/DatesPage.module.css
- fsp_frontend/src/pages/ProfilePage.jsx and ProfilePage.module.css
- fsp_frontend/src/components/memories/CalendarDump/CalendarView.jsx and CalendarView.module.css
- fsp_frontend/src/components/loveBoard/common/lbGraphics.module.css and lbUi.jsx
- fsp_frontend/src/components/loveBoard/CorkBoard/CorkBoard.jsx
- fsp_frontend/src/components/loveBoard/Toolbar/BoardToolbar.jsx and BoardMenu.jsx and SearchFilterPanel.jsx
- fsp_frontend/src/components/admin/Sidebar.jsx
- fsp_frontend/src/components/ProtectedRoute.jsx
- fsp_frontend/src/services/profileService.js
- fsp_frontend/src/queries/mutations.js
(If the paste is too long, send the remaining Love Board files — ArchiveDrawer, CollapsibleSection, AttachmentHandle, NoteCanvasEditor, PaperPicker, TextBoxHandle, LayerPanel, Sticker, LoveLettersPage — in a second message and ask for those files in a second answer.)
Backend (to change):
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/entity/User.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/dto/ProfileDTO.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/dto/response/AuthResponse.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/service/ProfileService.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/controller/ProfileController.java
- fsp_backend/src/main/resources/db/migration/V3__drive_file_ids.sql (style reference only)

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
