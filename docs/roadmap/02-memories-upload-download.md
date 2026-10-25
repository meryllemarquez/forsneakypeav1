# 02 · Memories: multi-upload + download (one photo, whole album as zip)

## 1. Goal and user flow
Add many photos to an album in one go with clear per-file progress, and take photos back out: one photo at full size from the lightbox, or the whole album as a `.zip` built in the browser. No database change; one new image size on the media endpoint and one batch endpoint.

**Upload flow (phone first).** Memories -> open an album -> "Add photos" (the existing upload button now opens the multi-upload sheet) -> the phone's photo picker opens with multiple selection (`<input type="file" accept="image/*" multiple>`; on desktop also drag files onto the sheet) -> a list of the chosen photos appears with thumbnails, size and a status -> tap "Upload N photos" -> up to 3 upload at a time, each with its own progress bar -> failures show "Retry", queued/in-progress items show "Cancel" -> when all finished: a `success` toast "Added 12 photos, love." and the grid shows them.
**Download one.** Lightbox -> "Download" icon button -> browser saves the full-size original (`<album>-<n>.<ext>`).
**Download album.** Album header -> "Download album" -> a progress sheet "Packing 14 / 40 photos…" -> `.zip` saves; "Cancel" stops it.

## 2. UX spec

### Multi-upload sheet (`PhotoUploadModal`, replaces the single-file upload modal in `MemoriesPage.jsx`)
- Uses `Modal` (`title="Add photos"`, `size="lg"`; full-width on phones). Body: (1) drop zone / "Choose photos" `Button variant="secondary"` (big, dashed ink border, doodle `camera` size 56, copy **"Drop photos here or tap to choose"**, hint **"Images only · up to 15 MB each · 20 at a time"**), (2) the queue list, (3) shared fields: optional **Caption** (applies to all, hint "Leave blank to add captions later") and **Where?** location, using `Field` + `input`.
- Queue row (min height 64px, phone: stacked): 56x56 thumb (`URL.createObjectURL`, revoked on unmount; HEIC/unsupported -> `Icon camera` placeholder), file name (ellipsis) + size ("3.2 MB"), status text, a trailing `IconButton` (X "Remove photo" before upload / "Cancel upload" while uploading / "Retry" with a lucide `RotateCcw` icon when failed). Progress: 8px bar with ink border, `--sea` fill, determinate from `onUploadProgress`; at 100% the row shows "Saving…" until the API call returns, then a check and "Added".
- Row states: `ready` ("Ready"), `queued` ("Waiting…"), `uploading` (bar + "63%"), `saving` ("Saving…"), `done` ("Added"), `failed` ("Couldn't upload · tap retry" with the reason: "Too big (18.4 MB, max 15)", "Not an image", "Connection dropped"), `cancelled` ("Cancelled"). Invalid files (non-image, > 15 MB, beyond 20) are rejected at pick time and listed once in an inline `role="alert"` note: **"2 photos were skipped: too big or not an image."** (do not add them to the queue).
- Footer: left "5 of 12 added" (live region `aria-live="polite"`), right `Button variant="primary"` **"Upload 12 photos"** (singular when 1; disabled when queue empty or nothing `ready`/`failed`); while running the primary becomes **"Cancel all"** (`variant="secondary"`). When finished: **"Done"** closes. Closing the sheet while uploading asks `ConfirmDialog` "Stop uploading? Photos already added will stay." (Keep going / Stop).
- Motion: rows enter with `slideUp` (0.25s, stagger 40ms, cap 600ms); the progress fill animates with CSS transition `width 0.2s linear`; a row that completes does a 120ms scale-pop of its check icon. Reduced motion: no stagger, no pop.
- Empty state (sheet just opened): only the drop zone. Error state (all failed): footer shows **"Retry failed (3)"**. Disabled: while the album is being deleted/closed.
- Keyboard: drop zone is a real `<button>`/label (Enter/Space opens the picker); rows are tab stops only for their action button; `Delete` on a focused row's remove button removes it; Escape closes (with confirm if busy). Screen reader: each row `role="listitem"`, status text in the row is the accessible description, progress uses `<progress value max aria-label="Uploading IMG_0012.jpg">`.
- Dark mode: all token-based; thumbnails keep an ink border.

### Concurrency, size and retry rules (why these numbers)
- **Max 20 files per batch, 15 MB each** (matches `MAX_UPLOAD_BYTES` and the server's `UploadService.MAX_BYTES`; images only). Worst case 300 MB passes through the user's connection, but **none of it passes through Render**: bytes go browser -> Google Drive. Render (512 MB) only handles tiny JSON requests (session + save), so memory is not a concern there.
- **3 parallel Drive uploads** (browsers allow about 6 connections per host, but 3 large PUTs keep a phone on 4G responsive and avoid Drive 429s). A small pool: `runPool(tasks, 3)` in `utils/uploadQueue.js`.
- **Session creation** (`POST /uploads/session`) is also done by the pool worker just before each PUT (never all 20 at once).
- **Retry**: automatic once with 1.5s backoff for network errors / 5xx / Drive 408/429/5xx; a 4xx from our API (400 too big, 403 origin) is not retried. Manual "Retry" per row re-runs only the failed step (see below).
- **Two-step failure handling**: step 1 PUT to Drive returns `driveFileId`; step 2 saves it. If step 2 fails, keep the `driveFileId` on the row and retry only step 2 (avoids re-uploading and avoids orphans). If the user removes the row after step 1 succeeded, the orphan Drive file is harmless (note in risks).
- **Cancel**: `AbortController` per row; `uploadImageToDrive(file, target, onProgress, signal)` gets a 4th param passed to axios `signal`. "Cancel all" aborts all and marks `cancelled`.
- **Saving**: use the new batch endpoint once per ~wave: after each file's PUT finishes push its `driveFileId` into a buffer and flush when 5 are ready, or when the queue drains (max 20 per request). This keeps the partner's notification to ONE ("Cj added 12 photos to 'Baguio'") and the album refetches once.
- **Refresh**: after the final flush `memoryMutations.addPhotosBatch(...)` invalidates `folders`, `calendar`, `home` (existing family behaviour).

### Download one photo (lightbox)
- New `IconButton label="Download this photo"` (lucide `Download`) in the lightbox toolbar next to existing controls (see `lightboxPanel` in `MemoriesPage.jsx`). Taps trigger an anchor click on the signed **original** URL `photo.downloadUrl` (`/api/v1/media/{id}?s=original&e=…&sig=…&dl=1&n=<name>`), which the server answers with `Content-Disposition: attachment` so it also works on iOS Safari (opens the share/save sheet).
- Toast `info` "Saving your photo…" for 1.5s; failure toast "Couldn't download that one. Try again?".
- Original size means **no resize** (the server streams the Drive original). Existing `thumb` (480) and `large` (1600) sizes unchanged.

### Download whole album (zip)
- Album header gets `Button size="sm" variant="secondary"` **"Download album"** with lucide `Download` (hidden when the album has 0 photos). Opens a small `Modal size="sm"` progress sheet: title **"Packing your album"**, doodle `film` or `camera` (size 56) with a gentle bounce loop (stop on reduced motion), a bar "14 of 40 photos", bytes so far, **Cancel**.
- Build: fetch each photo's `downloadUrl` (original) with concurrency 3 via `fetch(url, {signal})` -> `blob()`, append to the zip, release. **Native approach, no new dependency**: a ~80-line **store-only ZIP writer** (`utils/zipWriter.js`): images are already compressed, so deflate would waste CPU. It writes the local file header + data for each entry, then the central directory and end record, using a table-driven CRC-32; entries are kept as `Blob` parts (`new Blob([hdr, blob, ...])`) so memory is the blobs only. ZIP64 is not needed because the cap below keeps archives < 4 GB. (If the team prefers a library, `fflate@0.8` `Zip` + `ZipPassThrough` is the smallest option, ~8 kB gzipped, but the spec assumes the native writer.)
- **Caps for phones/Render**: whole-album zip is split into parts of at most **120 photos / ~350 MB** each: "Part 1 of 2". Reason: phone browsers can crash above ~500 MB of Blobs, and every byte flows Drive -> Render -> browser through `MediaController` (streamed in chunks, never fully in memory, but it costs Render bandwidth/time). If a part fails midway, you can retry that part only.
- **Desktop Chromium**: if `window.showSaveFilePicker` exists, stream the zip to disk instead of building one big Blob (no RAM limit); otherwise the Blob + `<a download>` path.
- File names inside the zip: `<album-slug>/NNN-<caption-slug or "photo">.<ext>`, ext from Content-Type (`image/jpeg -> jpg`, png, webp, gif, heic); duplicates get `-2`. Zip name `<album-slug>-photos[-part-1].zip`.
- Rate: honour signed URLs that may expire mid-job (valid 1-2 h): if a fetch returns 403, refetch the album (`getFolderById`) to get fresh URLs and retry that photo once.
- States: preparing ("Getting your photos ready…"), packing, done (toast "Your album is saved" + sheet closes after 1.2s), error ("Couldn't pack everything. 3 photos failed — try again?" with Retry), cancelled (silent close). Reduced motion: no bounce.
- Keyboard/SR: sheet is a `Modal`; progress `<progress>` with `aria-label="Packing album"`, count text in `aria-live="polite"` updated every 5 photos (not each one).

## 3. Files to change / add
Frontend:
- ADD `fsp_frontend/src/components/memories/PhotoUploadModal/PhotoUploadModal.jsx` + `.module.css`: the multi-upload sheet.
- ADD `fsp_frontend/src/components/memories/AlbumDownloadModal/AlbumDownloadModal.jsx` + `.module.css`: zip progress sheet.
- ADD `fsp_frontend/src/utils/uploadQueue.js`: `runPool`, retry/backoff, batching of saves.
- ADD `fsp_frontend/src/utils/zipWriter.js`: store-only ZIP writer + CRC-32 + `slugify`.
- CHANGE `fsp_frontend/src/api/driveUpload.js`: accept `signal`, expose `validateImageFile(file)` returning a reason string; keep `MAX_UPLOAD_BYTES`.
- CHANGE `fsp_frontend/src/services/memoryService.js`: `addPhotosBatch(folderId, items)`.
- CHANGE `fsp_frontend/src/queries/mutations.js`: `addPhotosBatch` in `useMemoryMutations()` with the same invalidation as `addPhoto` (header comment table updated).
- CHANGE `fsp_frontend/src/pages/MemoriesPage.jsx`: replace the single-file modal state (`uploadState`, `handleUploadPhoto`, `isUploadModalOpen`) with the new modal; add Download buttons (lightbox and album header). Keep single-photo edit/delete/caption flows.
- CHANGE `fsp_frontend/src/pages/MemoriesPage.module.css`: header button row, lightbox toolbar spacing.
Backend:
- CHANGE `service/MediaUrlService.java`: add `ORIGINAL("original", 0)` to `Size`; helper `downloadUrl(fileId, name)`.
- CHANGE `controller/MediaController.java`: for `original` call `drive.openOriginal` directly (no thumbnail attempt); when `dl=1` set `Content-Disposition: attachment; filename*=UTF-8''<sanitized n>`; keep signature check (`n`/`dl` are not signed, they only change the filename).
- CHANGE `dto/PhotoDTO.java`: add `downloadUrl` (signed `original` URL; null for legacy Supabase photos, which use `photoUrl`).
- CHANGE `service/MemoryService.java`: fill `downloadUrl` where PhotoDTO is built; add `addPhotosToFolder(folderId, items, userId)` doing one activity-log entry and ONE `notifyOthers`.
- CHANGE `controller/MemoryController.java`: `POST /folders/{folderId}/photos/batch`.
- ADD `dto/request/AddPhotosBatchRequest.java` (`List<Item> items`, `@Size(max=20)`).
- CHANGE `service/UploadService.java`: none needed (15 MB and image/* already enforced); only add a `target` rate limit if desired (see risks).

## 4. Data
No Flyway migration. Reuses `memory_photos(drive_file_id, caption, location, …)`.
Storage: a row is about 200-300 bytes (uuid, folder id, drive id ~33 chars, caption/location text, timestamps). **~0.25 KB per photo, ~250 KB per 1,000 photos** in Postgres. The images themselves are in Google Drive (Drive quota, not database).

## 5. API
**New:** `POST /api/v1/memories/folders/{folderId}/photos/batch` · `@PreAuthorize("isAuthenticated()")` (any signed-in user, same as `addPhoto`).
Request:
```json
{ "items": [
  { "driveFileId": "1AbCdEfGhIjKlMnOpQrStUvWxYz012345", "caption": "Sunset", "location": "Baguio" },
  { "driveFileId": "1ZyXwVuTsRqPoNmLkJiHgFeDcBa987654", "caption": null, "location": null }
] }
```
Response `200`:
```json
{ "added": [ { "id": "6f0c…", "folderId": "a1b2…", "driveFileId": "1AbC…", "thumbUrl": "/api/v1/media/1AbC…?s=thumb&e=1767225600&sig=…", "photoUrl": "…?s=large…", "downloadUrl": "…?s=original…", "caption": "Sunset", "location": "Baguio", "isFavorite": false, "createdAt": "2026-10-25T10:00:00Z" } ],
  "failed": [ { "driveFileId": "1ZyX…", "reason": "File not found in Drive" } ] }
```
Errors: `400` empty list, > 20 items, or blank/invalid `driveFileId` (`^[A-Za-z0-9_-]{10,100}$`); `404` folder not found; `401`.
Unchanged: `POST /api/v1/uploads/session`, `POST /memories/folders/{id}/photos`.
**Changed:** `GET /api/v1/media/{fileId}?s=original&e=&sig=[&dl=1&n=name]` · public but signed · `403` bad/expired signature, `404` Drive missing, `502` Drive interrupted. Response streams the original with `Content-Type` from Drive and, with `dl=1`, `Content-Disposition: attachment`.

## 6. Edge cases and risks
- **Two people uploading to the same album**: independent rows, no conflict; each gets one notification per batch; the other's grid updates on the next `folders` refetch.
- **Deleting while uploading**: if the album is deleted (by the partner) mid-upload, the save returns 404: mark remaining rows failed with "This album is gone." and stop the pool.
- **Photo deleted while zipping**: that fetch 404s; skip it, count as failed, finish the rest and report "39 of 40 saved".
- **Old data**: Supabase-era photos have `photoUrl` but no `driveFileId`; for them `downloadUrl` is null and the client downloads `photoUrl` via fetch+blob (same-origin policy permitting) or skips with a message. The zip includes them if fetchable.
- **Drive failures**: 403 quota/rate -> auto-retry once, then "Retry"; expired upload session URL -> create a new session on retry; Drive outage -> all rows fail with a single banner "Google Drive isn't answering right now."
- **Orphans**: PUT succeeded but save failed and the user leaves -> a private Drive file with no row. Acceptable; a later admin "orphan sweep" is out of scope.
- **HEIC**: accepted by the server; browsers other than Safari cannot render it in `<img>`; the Drive thumbnail endpoint handles the grid. Preview in the queue uses a doodle placeholder.
- **Memory on phones**: never read files into memory (pass `File` to axios). The zip path is the only large-memory feature; caps above protect it; stop gracefully on `QuotaExceeded`/OOM errors with "Try a smaller part".
- **Render**: the zip route makes Render proxy Drive originals; stay under the caps, concurrency 3, and do not add server-side zipping.
- **Rate limiting**: session creation is cheap but should not allow abuse; reuse the existing rate limiter style if a per-user limit (e.g. 60 sessions/min) is desired.
- **Signed URL expiry** mid-zip: handled by refetch-once.
- Filenames from captions can contain illegal characters/emoji: slugify to `[a-z0-9-]`.

## 7. Acceptance checklist
- [ ] 390px: pick 12 photos from the gallery picker; rows readable, no horizontal scroll, buttons >= 44px; progress shows; finish adds all 12; one partner notification.
- [ ] Pick a PDF and an 18 MB image: both skipped with the inline message; the rest upload.
- [ ] Turn on airplane mode mid-upload: rows fail with Retry; reconnect and Retry completes without duplicates.
- [ ] Cancel one row and "Cancel all" work; closing the sheet mid-upload asks to confirm.
- [ ] Lightbox Download saves the original (check file size > the 1600px version) on desktop and on an iPhone.
- [ ] Download album (5 photos and a 130-photo album -> 2 parts): zips open correctly, names sane, photos intact.
- [ ] Dark mode: sheet, bars and rows readable; thumbnails have borders.
- [ ] Keyboard-only: pick files via drop zone button, remove a row, upload, cancel, close; focus returns to "Add photos".
- [ ] Screen reader: each row announces name, size and status; live region announces "5 of 12 added".
- [ ] Reduced motion: no stagger, no bounce, progress still visible.
- [ ] "Delete all" memories still wipes everything including newly added photos.

## 8. Commit title
`Memories: upload many photos at once with progress, and download photos or whole albums`

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

# FEATURE SPEC (02 · Memories: multi-upload + download (one photo, whole album as zip))

## 1. Goal and user flow
Add many photos to an album in one go with clear per-file progress, and take photos back out: one photo at full size from the lightbox, or the whole album as a `.zip` built in the browser. No database change; one new image size on the media endpoint and one batch endpoint.

**Upload flow (phone first).** Memories -> open an album -> "Add photos" (the existing upload button now opens the multi-upload sheet) -> the phone's photo picker opens with multiple selection (`<input type="file" accept="image/*" multiple>`; on desktop also drag files onto the sheet) -> a list of the chosen photos appears with thumbnails, size and a status -> tap "Upload N photos" -> up to 3 upload at a time, each with its own progress bar -> failures show "Retry", queued/in-progress items show "Cancel" -> when all finished: a `success` toast "Added 12 photos, love." and the grid shows them.
**Download one.** Lightbox -> "Download" icon button -> browser saves the full-size original (`<album>-<n>.<ext>`).
**Download album.** Album header -> "Download album" -> a progress sheet "Packing 14 / 40 photos…" -> `.zip` saves; "Cancel" stops it.

## 2. UX spec

### Multi-upload sheet (`PhotoUploadModal`, replaces the single-file upload modal in `MemoriesPage.jsx`)
- Uses `Modal` (`title="Add photos"`, `size="lg"`; full-width on phones). Body: (1) drop zone / "Choose photos" `Button variant="secondary"` (big, dashed ink border, doodle `camera` size 56, copy **"Drop photos here or tap to choose"**, hint **"Images only · up to 15 MB each · 20 at a time"**), (2) the queue list, (3) shared fields: optional **Caption** (applies to all, hint "Leave blank to add captions later") and **Where?** location, using `Field` + `input`.
- Queue row (min height 64px, phone: stacked): 56x56 thumb (`URL.createObjectURL`, revoked on unmount; HEIC/unsupported -> `Icon camera` placeholder), file name (ellipsis) + size ("3.2 MB"), status text, a trailing `IconButton` (X "Remove photo" before upload / "Cancel upload" while uploading / "Retry" with a lucide `RotateCcw` icon when failed). Progress: 8px bar with ink border, `--sea` fill, determinate from `onUploadProgress`; at 100% the row shows "Saving…" until the API call returns, then a check and "Added".
- Row states: `ready` ("Ready"), `queued` ("Waiting…"), `uploading` (bar + "63%"), `saving` ("Saving…"), `done` ("Added"), `failed` ("Couldn't upload · tap retry" with the reason: "Too big (18.4 MB, max 15)", "Not an image", "Connection dropped"), `cancelled` ("Cancelled"). Invalid files (non-image, > 15 MB, beyond 20) are rejected at pick time and listed once in an inline `role="alert"` note: **"2 photos were skipped: too big or not an image."** (do not add them to the queue).
- Footer: left "5 of 12 added" (live region `aria-live="polite"`), right `Button variant="primary"` **"Upload 12 photos"** (singular when 1; disabled when queue empty or nothing `ready`/`failed`); while running the primary becomes **"Cancel all"** (`variant="secondary"`). When finished: **"Done"** closes. Closing the sheet while uploading asks `ConfirmDialog` "Stop uploading? Photos already added will stay." (Keep going / Stop).
- Motion: rows enter with `slideUp` (0.25s, stagger 40ms, cap 600ms); the progress fill animates with CSS transition `width 0.2s linear`; a row that completes does a 120ms scale-pop of its check icon. Reduced motion: no stagger, no pop.
- Empty state (sheet just opened): only the drop zone. Error state (all failed): footer shows **"Retry failed (3)"**. Disabled: while the album is being deleted/closed.
- Keyboard: drop zone is a real `<button>`/label (Enter/Space opens the picker); rows are tab stops only for their action button; `Delete` on a focused row's remove button removes it; Escape closes (with confirm if busy). Screen reader: each row `role="listitem"`, status text in the row is the accessible description, progress uses `<progress value max aria-label="Uploading IMG_0012.jpg">`.
- Dark mode: all token-based; thumbnails keep an ink border.

### Concurrency, size and retry rules (why these numbers)
- **Max 20 files per batch, 15 MB each** (matches `MAX_UPLOAD_BYTES` and the server's `UploadService.MAX_BYTES`; images only). Worst case 300 MB passes through the user's connection, but **none of it passes through Render**: bytes go browser -> Google Drive. Render (512 MB) only handles tiny JSON requests (session + save), so memory is not a concern there.
- **3 parallel Drive uploads** (browsers allow about 6 connections per host, but 3 large PUTs keep a phone on 4G responsive and avoid Drive 429s). A small pool: `runPool(tasks, 3)` in `utils/uploadQueue.js`.
- **Session creation** (`POST /uploads/session`) is also done by the pool worker just before each PUT (never all 20 at once).
- **Retry**: automatic once with 1.5s backoff for network errors / 5xx / Drive 408/429/5xx; a 4xx from our API (400 too big, 403 origin) is not retried. Manual "Retry" per row re-runs only the failed step (see below).
- **Two-step failure handling**: step 1 PUT to Drive returns `driveFileId`; step 2 saves it. If step 2 fails, keep the `driveFileId` on the row and retry only step 2 (avoids re-uploading and avoids orphans). If the user removes the row after step 1 succeeded, the orphan Drive file is harmless (note in risks).
- **Cancel**: `AbortController` per row; `uploadImageToDrive(file, target, onProgress, signal)` gets a 4th param passed to axios `signal`. "Cancel all" aborts all and marks `cancelled`.
- **Saving**: use the new batch endpoint once per ~wave: after each file's PUT finishes push its `driveFileId` into a buffer and flush when 5 are ready, or when the queue drains (max 20 per request). This keeps the partner's notification to ONE ("Cj added 12 photos to 'Baguio'") and the album refetches once.
- **Refresh**: after the final flush `memoryMutations.addPhotosBatch(...)` invalidates `folders`, `calendar`, `home` (existing family behaviour).

### Download one photo (lightbox)
- New `IconButton label="Download this photo"` (lucide `Download`) in the lightbox toolbar next to existing controls (see `lightboxPanel` in `MemoriesPage.jsx`). Taps trigger an anchor click on the signed **original** URL `photo.downloadUrl` (`/api/v1/media/{id}?s=original&e=…&sig=…&dl=1&n=<name>`), which the server answers with `Content-Disposition: attachment` so it also works on iOS Safari (opens the share/save sheet).
- Toast `info` "Saving your photo…" for 1.5s; failure toast "Couldn't download that one. Try again?".
- Original size means **no resize** (the server streams the Drive original). Existing `thumb` (480) and `large` (1600) sizes unchanged.

### Download whole album (zip)
- Album header gets `Button size="sm" variant="secondary"` **"Download album"** with lucide `Download` (hidden when the album has 0 photos). Opens a small `Modal size="sm"` progress sheet: title **"Packing your album"**, doodle `film` or `camera` (size 56) with a gentle bounce loop (stop on reduced motion), a bar "14 of 40 photos", bytes so far, **Cancel**.
- Build: fetch each photo's `downloadUrl` (original) with concurrency 3 via `fetch(url, {signal})` -> `blob()`, append to the zip, release. **Native approach, no new dependency**: a ~80-line **store-only ZIP writer** (`utils/zipWriter.js`): images are already compressed, so deflate would waste CPU. It writes the local file header + data for each entry, then the central directory and end record, using a table-driven CRC-32; entries are kept as `Blob` parts (`new Blob([hdr, blob, ...])`) so memory is the blobs only. ZIP64 is not needed because the cap below keeps archives < 4 GB. (If the team prefers a library, `fflate@0.8` `Zip` + `ZipPassThrough` is the smallest option, ~8 kB gzipped, but the spec assumes the native writer.)
- **Caps for phones/Render**: whole-album zip is split into parts of at most **120 photos / ~350 MB** each: "Part 1 of 2". Reason: phone browsers can crash above ~500 MB of Blobs, and every byte flows Drive -> Render -> browser through `MediaController` (streamed in chunks, never fully in memory, but it costs Render bandwidth/time). If a part fails midway, you can retry that part only.
- **Desktop Chromium**: if `window.showSaveFilePicker` exists, stream the zip to disk instead of building one big Blob (no RAM limit); otherwise the Blob + `<a download>` path.
- File names inside the zip: `<album-slug>/NNN-<caption-slug or "photo">.<ext>`, ext from Content-Type (`image/jpeg -> jpg`, png, webp, gif, heic); duplicates get `-2`. Zip name `<album-slug>-photos[-part-1].zip`.
- Rate: honour signed URLs that may expire mid-job (valid 1-2 h): if a fetch returns 403, refetch the album (`getFolderById`) to get fresh URLs and retry that photo once.
- States: preparing ("Getting your photos ready…"), packing, done (toast "Your album is saved" + sheet closes after 1.2s), error ("Couldn't pack everything. 3 photos failed — try again?" with Retry), cancelled (silent close). Reduced motion: no bounce.
- Keyboard/SR: sheet is a `Modal`; progress `<progress>` with `aria-label="Packing album"`, count text in `aria-live="polite"` updated every 5 photos (not each one).

## 3. Files to change / add
Frontend:
- ADD `fsp_frontend/src/components/memories/PhotoUploadModal/PhotoUploadModal.jsx` + `.module.css`: the multi-upload sheet.
- ADD `fsp_frontend/src/components/memories/AlbumDownloadModal/AlbumDownloadModal.jsx` + `.module.css`: zip progress sheet.
- ADD `fsp_frontend/src/utils/uploadQueue.js`: `runPool`, retry/backoff, batching of saves.
- ADD `fsp_frontend/src/utils/zipWriter.js`: store-only ZIP writer + CRC-32 + `slugify`.
- CHANGE `fsp_frontend/src/api/driveUpload.js`: accept `signal`, expose `validateImageFile(file)` returning a reason string; keep `MAX_UPLOAD_BYTES`.
- CHANGE `fsp_frontend/src/services/memoryService.js`: `addPhotosBatch(folderId, items)`.
- CHANGE `fsp_frontend/src/queries/mutations.js`: `addPhotosBatch` in `useMemoryMutations()` with the same invalidation as `addPhoto` (header comment table updated).
- CHANGE `fsp_frontend/src/pages/MemoriesPage.jsx`: replace the single-file modal state (`uploadState`, `handleUploadPhoto`, `isUploadModalOpen`) with the new modal; add Download buttons (lightbox and album header). Keep single-photo edit/delete/caption flows.
- CHANGE `fsp_frontend/src/pages/MemoriesPage.module.css`: header button row, lightbox toolbar spacing.
Backend:
- CHANGE `service/MediaUrlService.java`: add `ORIGINAL("original", 0)` to `Size`; helper `downloadUrl(fileId, name)`.
- CHANGE `controller/MediaController.java`: for `original` call `drive.openOriginal` directly (no thumbnail attempt); when `dl=1` set `Content-Disposition: attachment; filename*=UTF-8''<sanitized n>`; keep signature check (`n`/`dl` are not signed, they only change the filename).
- CHANGE `dto/PhotoDTO.java`: add `downloadUrl` (signed `original` URL; null for legacy Supabase photos, which use `photoUrl`).
- CHANGE `service/MemoryService.java`: fill `downloadUrl` where PhotoDTO is built; add `addPhotosToFolder(folderId, items, userId)` doing one activity-log entry and ONE `notifyOthers`.
- CHANGE `controller/MemoryController.java`: `POST /folders/{folderId}/photos/batch`.
- ADD `dto/request/AddPhotosBatchRequest.java` (`List<Item> items`, `@Size(max=20)`).
- CHANGE `service/UploadService.java`: none needed (15 MB and image/* already enforced); only add a `target` rate limit if desired (see risks).

## 4. Data
No Flyway migration. Reuses `memory_photos(drive_file_id, caption, location, …)`.
Storage: a row is about 200-300 bytes (uuid, folder id, drive id ~33 chars, caption/location text, timestamps). **~0.25 KB per photo, ~250 KB per 1,000 photos** in Postgres. The images themselves are in Google Drive (Drive quota, not database).

## 5. API
**New:** `POST /api/v1/memories/folders/{folderId}/photos/batch` · `@PreAuthorize("isAuthenticated()")` (any signed-in user, same as `addPhoto`).
Request:
```json
{ "items": [
  { "driveFileId": "1AbCdEfGhIjKlMnOpQrStUvWxYz012345", "caption": "Sunset", "location": "Baguio" },
  { "driveFileId": "1ZyXwVuTsRqPoNmLkJiHgFeDcBa987654", "caption": null, "location": null }
] }
```
Response `200`:
```json
{ "added": [ { "id": "6f0c…", "folderId": "a1b2…", "driveFileId": "1AbC…", "thumbUrl": "/api/v1/media/1AbC…?s=thumb&e=1767225600&sig=…", "photoUrl": "…?s=large…", "downloadUrl": "…?s=original…", "caption": "Sunset", "location": "Baguio", "isFavorite": false, "createdAt": "2026-10-25T10:00:00Z" } ],
  "failed": [ { "driveFileId": "1ZyX…", "reason": "File not found in Drive" } ] }
```
Errors: `400` empty list, > 20 items, or blank/invalid `driveFileId` (`^[A-Za-z0-9_-]{10,100}$`); `404` folder not found; `401`.
Unchanged: `POST /api/v1/uploads/session`, `POST /memories/folders/{id}/photos`.
**Changed:** `GET /api/v1/media/{fileId}?s=original&e=&sig=[&dl=1&n=name]` · public but signed · `403` bad/expired signature, `404` Drive missing, `502` Drive interrupted. Response streams the original with `Content-Type` from Drive and, with `dl=1`, `Content-Disposition: attachment`.

## 6. Edge cases and risks
- **Two people uploading to the same album**: independent rows, no conflict; each gets one notification per batch; the other's grid updates on the next `folders` refetch.
- **Deleting while uploading**: if the album is deleted (by the partner) mid-upload, the save returns 404: mark remaining rows failed with "This album is gone." and stop the pool.
- **Photo deleted while zipping**: that fetch 404s; skip it, count as failed, finish the rest and report "39 of 40 saved".
- **Old data**: Supabase-era photos have `photoUrl` but no `driveFileId`; for them `downloadUrl` is null and the client downloads `photoUrl` via fetch+blob (same-origin policy permitting) or skips with a message. The zip includes them if fetchable.
- **Drive failures**: 403 quota/rate -> auto-retry once, then "Retry"; expired upload session URL -> create a new session on retry; Drive outage -> all rows fail with a single banner "Google Drive isn't answering right now."
- **Orphans**: PUT succeeded but save failed and the user leaves -> a private Drive file with no row. Acceptable; a later admin "orphan sweep" is out of scope.
- **HEIC**: accepted by the server; browsers other than Safari cannot render it in `<img>`; the Drive thumbnail endpoint handles the grid. Preview in the queue uses a doodle placeholder.
- **Memory on phones**: never read files into memory (pass `File` to axios). The zip path is the only large-memory feature; caps above protect it; stop gracefully on `QuotaExceeded`/OOM errors with "Try a smaller part".
- **Render**: the zip route makes Render proxy Drive originals; stay under the caps, concurrency 3, and do not add server-side zipping.
- **Rate limiting**: session creation is cheap but should not allow abuse; reuse the existing rate limiter style if a per-user limit (e.g. 60 sessions/min) is desired.
- **Signed URL expiry** mid-zip: handled by refetch-once.
- Filenames from captions can contain illegal characters/emoji: slugify to `[a-z0-9-]`.

## 7. Acceptance checklist
- [ ] 390px: pick 12 photos from the gallery picker; rows readable, no horizontal scroll, buttons >= 44px; progress shows; finish adds all 12; one partner notification.
- [ ] Pick a PDF and an 18 MB image: both skipped with the inline message; the rest upload.
- [ ] Turn on airplane mode mid-upload: rows fail with Retry; reconnect and Retry completes without duplicates.
- [ ] Cancel one row and "Cancel all" work; closing the sheet mid-upload asks to confirm.
- [ ] Lightbox Download saves the original (check file size > the 1600px version) on desktop and on an iPhone.
- [ ] Download album (5 photos and a 130-photo album -> 2 parts): zips open correctly, names sane, photos intact.
- [ ] Dark mode: sheet, bars and rows readable; thumbnails have borders.
- [ ] Keyboard-only: pick files via drop zone button, remove a row, upload, cancel, close; focus returns to "Add photos".
- [ ] Screen reader: each row announces name, size and status; live region announces "5 of 12 added".
- [ ] Reduced motion: no stagger, no bounce, progress still visible.
- [ ] "Delete all" memories still wipes everything including newly added photos.

# FILES I WILL PASTE BELOW
Frontend (shared, to reuse):
- fsp_frontend/src/components/ui/Modal/Modal.jsx and Modal.module.css
- fsp_frontend/src/components/ui/ConfirmDialog/ConfirmDialog.jsx
- fsp_frontend/src/components/ui/Button/Button.jsx and Button.module.css
- fsp_frontend/src/components/ui/IconButton/IconButton.jsx and IconButton.module.css
- fsp_frontend/src/components/ui/Field/Field.jsx and fsp_frontend/src/components/ui/FormControls.module.css
- fsp_frontend/src/components/Icon/Icon.jsx
- fsp_frontend/src/constants/animations.js
- fsp_frontend/src/hooks/useNotification.js
Frontend (to change):
- fsp_frontend/src/api/driveUpload.js
- fsp_frontend/src/api/axiosConfig.js
- fsp_frontend/src/services/memoryService.js
- fsp_frontend/src/queries/mutations.js
- fsp_frontend/src/queries/queryKeys.js
- fsp_frontend/src/pages/MemoriesPage.jsx and MemoriesPage.module.css
Backend (to change):
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/service/MediaUrlService.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/controller/MediaController.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/service/DriveClient.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/dto/PhotoDTO.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/service/MemoryService.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/controller/MemoryController.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/service/UploadService.java

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
