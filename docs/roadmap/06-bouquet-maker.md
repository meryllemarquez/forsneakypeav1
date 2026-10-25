# 06 · Bouquet maker

## 1. Goal and user flow
Make a little bouquet picture for each other: pick wrap paper, ribbon and flowers, drag/rotate/scale/layer them with undo, tuck in a handwritten letter card, save it, browse a gallery of "our bouquets", export a high-resolution PNG, and optionally pin it on the Love Board as a sticker. Stored as a small JSON "recipe" (no images in the database, nothing in Drive).

**Flow (phone).** Home -> "Make a bouquet" card -> `/bouquets` gallery (empty: "No bouquets yet, love.") -> "New bouquet" -> maker: the bouquet canvas on top, a tool tray at the bottom with tabs **Wrap · Ribbon · Flowers · Card** -> tap a flower to drop it into the bouquet -> drag it, use the selection handles to rotate/scale, buttons to layer/delete/duplicate -> Undo/Redo any time -> **Card** tab: write the letter -> "Save" (names it) -> gallery -> open a bouquet: **Edit, Export PNG, Send to Love Board, Delete**.

## 2. UX spec

### Routes and entry points
- `/bouquets` (gallery) and `/bouquets/new`, `/bouquets/:id` (view), `/bouquets/:id/edit` (maker), all protected (`ROLE_USER`), lazy loaded. Entry: a Home card **"Say it with flowers"** (Caveat sub-line **"build a bouquet for your person"**, plain `tulip` + `daisy` icons, not a sticker cluster); not added to the 4-item nav. The Love Board "Send to board" and a "Make one" link from the Letters page empty state are optional extras.
- New icons in the kit: `rose`, `sunflower`, `babysbreath`, `lily` (heads only; see drawing guide). `tulip` and `daisy` already exist.

### Gallery (`/bouquets`)
- 390px: header (back to Home, title "Our bouquets", `Button variant="primary"` "New bouquet"), 2-column grid of cards (`--surface`, 2px outline, radius 24, offset shadow `--shadow-sea`); each card shows the live-rendered bouquet (small SVG from the recipe, `aspect-ratio: 4/5`), the title (Shantell), a Caveat line "by Chicken · 12 Oct" with the `her`/`him` doodle 24px. Tap -> view. 1440px: 4-5 columns, max width 1100px.
- States: loading = 4 skeleton cards; empty = `tulip` doodle 96px + **"No bouquets yet, love."** + primary "Make our first one"; error = "Couldn't load the bouquets." + Try again. Reveal: cards stagger in (`slideUp`, 60ms steps, cap 600ms). Hover (desktop): lift `translate(-2px,-2px)` and shadow 8px. Sort newest first; filter chips "All · Mine · Theirs" (`Chip radio`).

### Maker layout
- **390px**: top bar (`IconButton` back/close with "Discard changes?" confirm when dirty; title input "Untitled bouquet"; **Save** `Button size="sm" variant="primary"`), canvas (4:5, full width minus 16px gutters, max height ~52vh, centered, `touch-action: none` on the canvas only), under it the **selection toolbar** (appears only with a selection: Rotate -15, Rotate +15, Smaller, Bigger, Forward, Back, Duplicate, Delete — each a 44px `IconButton` with `aria-label`s, horizontally scrollable) and the global row (**Undo**, **Redo**, **Clear all**), then the **tool tray**: `Tabs` (Wrap · Ribbon · Flowers · Card) with the panel below (tray height ~200px, scrolls vertically).
- **1440px**: three columns: left tool tray (320px), centre canvas (up to 520x650), right "Layers" list (draggable order; same as Forward/Back) + selection inspector.
- Canvas: logical size **400 x 500** SVG viewBox; paper-dotted `--paper-warm` background on screen (the export uses a flat light `#FFF8E8`). The wrap paper is drawn as a cone/fan shape at the bottom-centre (SVG path with a fold line and the paper pattern); stems converge at the "gather point" (200, 340) and are drawn automatically (curved `Q` strokes, 4px `#5E9B4E`, ink outline) from each flower's base to the gather point, **behind** the wrap's front layer so flowers look tucked inside; ribbon wraps at the gather point (band + optional bow).
- **Tool panels**:
  - **Wrap** (6 `RadioGroup` tiles with mini previews): `kraft` (`#E2C98F` with a fold line), `sea-dots` (`--sea-tint` + white dots), `citrus-stripes` (`--citrus-tint` + `--citrus` stripes), `gelato-gingham`, `cloud-white` (white with scalloped edge), `amalfi-stars` (`--amalfi-tint` + tiny white stars). Patterns are SVG `<pattern>`s. Text never sits on these patterns (the card has its own plate).
  - **Ribbon**: style (`bow`, `band`, `none`) as `RadioGroup` + colour `ColorSwatchGroup` (`sea`, `citrus`, `gelato`, `amalfi`, `white`, `pink #FF8FB1`; **no tomato**). The bow squashes/pops in when chosen (spring `{380, 16}`).
  - **Flowers**: grid of 6 tiles (tulip, daisy, rose, sunflower, babysbreath, lily), each with a colour variant row (2-3 tints per flower: e.g. tulip `citrus/sea-tint/white`, rose `pink/gelato/white`; variants are palette-driven fills passed to the flower renderer). Tapping a tile adds that flower near the gather point at a fan angle (-35 to +35deg, alternating sides) with a small drop spring (`{380, 18}`) and selects it. Limit **40 flowers** (toast "That's a full bouquet, love."). Plus **Leaf** (`leaf` filler, free) and `babysbreath` as "filler".
  - **Card** tab: `Field` textarea "Write something sweet" (max **240 chars**, counter, Caveat font preview), optional "To" and "From" (max 24 each, default "To: ___ / From: Chicken|Junebug" based on the signed-in user), card paper `RadioGroup` (`gelato`, `sea`, `citrus`, `lined`; reuse `PAPERS` from `constants/loveBoardCatalog.js`), toggle "Show the card in the picture" (on by default). The card is a draggable item (`type: 'card'`, 120 x 150 px logical, tucked at bottom-right, tilted +8deg) that displays the first ~60 characters in Caveat; tapping it in view mode opens the full letter in a `Modal`. The PNG export includes the full letter text on the card (wrapped, shrunk to fit), up to 240 chars.
- **Interaction details**:
  - Drag: pointer events on the item (`useCanvasDrag` from `hooks/useCanvasDrag.js` is reusable for pointer-capture drag; the maker needs its own SVG coordinate conversion via `svg.getScreenCTM().inverse()`); items stay within the canvas rect (clamped).
  - Selection ring: dashed `--outline` rounded box with 3 handles at 44px hit size (visual 18px): **rotate** (top, circular arrow), **scale** (bottom-right corner), **delete** (top-left, X). Two-finger pinch/rotate on a selected item (Pointer Events with two pointers); mouse wheel + Alt rotates on desktop.
  - Layering: z-order is the array order; Forward/Back swap one step, Shift+Forward = to front, Shift+Back = to back. "Layers" list (desktop) and an accessible "Layer order" list in a `Modal` on phones (rows with Up/Down buttons).
  - **Undo/Redo**: immutable snapshots of the recipe pushed on "commit" events (drag end, rotate end, add, delete, colour change, text blur) not on every pointer move; stack depth 50; coalesce changes within 400ms of the same item/property. Buttons disabled when empty (`aria-disabled`). `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`/`Ctrl+Y`.
  - Keyboard (when an item is selected): arrows nudge 4 logical px (Shift 16), `[` / `]` rotate -5/+5deg, `-` / `+` scale, `PageUp`/`PageDown` layer, `Delete`/`Backspace` remove, `D` duplicate, `Tab` cycles items in layer order, `Esc` deselects. Items are `role="button"` `tabindex="0"` `aria-label="Rose, flower 3 of 12, selected"`.
  - Feedback: selection pop (`scale 1.06` for 120ms), delete = quick shrink-fade 160ms, new flower drop-in. Reduced motion: no springs, no pop, instant placement.
- **Dirty state**: navigating away with unsaved changes -> `ConfirmDialog` "Leave without saving?" (Stay / Leave). Autosave draft to `localStorage['fsp-bouquet-draft']` every 2s (so a crashed tab can restore: banner "Pick up where you left off?").
- **Save**: title required (1-40, default "Untitled bouquet" prompts a rename `Field`), `Button primary` "Save bouquet" (busy "Saving…"); success toast `success` "Saved to our bouquets"; error toast "Couldn't save. Your bouquet is still here."
- **View screen** (`/bouquets/:id`): big bouquet (max 520px), title, by/when, buttons: `Edit` (secondary), `Export PNG` (secondary), `Send to Love Board` (primary — the single tomato button), `Delete` (ghost danger -> ConfirmDialog "Throw this bouquet away?"). The letter card opens on tap.
- **Export PNG**: client-side, high resolution **2400 x 3000 px** (6x logical), light background `#FFF8E8`, forced light palette regardless of theme. Method (no new dependency): serialize the bouquet `<svg>` with all colours **inlined as hex** (resolve `var(--x)` to the light values before serializing) -> `Blob` (`image/svg+xml`) -> `Image` -> draw on a `<canvas>` 2400x3000 with `imageSmoothingQuality='high'` -> draw the letter text with canvas `fillText` using `await document.fonts.load('48px Caveat')` first (web fonts do not load inside SVG-as-image) -> `canvas.toBlob('image/png')` -> download `bouquet-<slug>.png`; on iOS Safari use `navigator.share({files})` when available else open the blob URL. Memory ~ 2400x3000x4 = 29 MB: acceptable; fall back to 1600x2000 on failure. A thin 8px `#FFF8E8` margin and a tiny footer "for sneakypea" in Caveat at 40% opacity. Toast "Saved your bouquet picture".
- **Send to Love Board**: creates a Love Board **sticker** (existing `love_stickers` table; `image` is `varchar(120)`) with `image = "bouquet:<bouquetId>"`, default position near the board centre, scale 1.4. The Love Board's `Sticker.jsx` resolves `bouquet:<id>` by reading the bouquet from the `useBouquets()` cache (fetch the list once; the recipe is small) and renders the same SVG at sticker size (no `sticker` plate, a soft drop shadow like a paper cut-out). If the bouquet was deleted, the sticker renders the `tulip` icon. Button copy: **"Pin to the Love Board"**; success toast "Pinned! Go see it on the board." with a "Go to board" action text link. Allowed from the view screen only (needs a saved id).
- Dark mode: tool tray and gallery follow tokens; the canvas surface follows the theme but the bouquet artwork itself (paper, flowers, ribbon) is the same in both themes; the canvas gets a `--paper-warm` backdrop and a subtle inner outline so the light wrap paper reads on navy.

### New flower drawing guide (add to `GLYPHS`, heads only, 64x64, same style as the kit)
Same rules as the food doodles in commit 04 (flat fills, ink stroke from the wrapper, <= 8 shapes, one white highlight, slightly wobbly). Heads are centred at (32, 28) so the renderer can attach a stem at (32, 52). Starter drawings:
- `rose`: outer petals `M32 10 C16 10 10 26 18 38 C24 48 40 48 46 38 C54 26 48 10 32 10 Z` fill pink `#FF8FB1`; inner spiral `M32 20 C26 20 24 28 30 30 C36 32 40 26 36 22 C34 20 30 22 31 26` stroke only; two small curved petal lines on the sides; tiny white highlight arc top-left; 2 small green sepals at the base `#5E9B4E`.
- `sunflower`: 12 petals as rounded triangles around a centre (each `M32 6 L36 18 L28 18 Z` rotated in 30deg steps) fill `#FFE680` with ink outlines; centre circle r=9 fill `#8A4B2A` with 5 dots `#172B70`; one white highlight on a petal.
- `babysbreath`: a loose spray: 3 thin branching strokes from the base `(32,52)` (ink) and 9 tiny circles r=2.6 filled `#FFFFFF` at the tips, 2 filled `#CDE7FF`; no big petals; reads as filler.
- `lily`: six-petal star: three big pointed petals up-left/up/up-right `M32 28 C22 22 18 12 22 6 C28 10 32 18 32 28 Z` (mirror and rotate) fill `#FFF0B3`; three lower recurved petals fill `#FFD8A0`; orange spots (3 dots `#FF9F1C`) on petals; stamens: three short ink lines ending in small dots `#FF9F1C` (no tomato).
- `leaf` (filler, optional): simple almond shape fill `#5E9B4E` with a centre vein.
Colour variants are applied by swapping the main petal fill; the renderer receives `{name, tint}`.

## 3. Files to change / add
Frontend:
- ADD `fsp_frontend/src/pages/BouquetGalleryPage.jsx` + `.module.css`; `BouquetViewPage.jsx`; `BouquetMakerPage.jsx` + `.module.css`.
- ADD `fsp_frontend/src/components/bouquet/BouquetCanvas/BouquetCanvas.jsx` + `.module.css`: the SVG renderer used everywhere (maker, gallery thumbs, view, Love Board sticker). Pure function of the recipe.
- ADD `fsp_frontend/src/components/bouquet/BouquetCanvas/parts.jsx`: wrap shapes + patterns, ribbon shapes, stems, card, flower wrappers (`FlowerHead` using `GLYPHS`).
- ADD `fsp_frontend/src/components/bouquet/ToolTray/*`: `WrapPanel`, `RibbonPanel`, `FlowerPanel`, `CardPanel`.
- ADD `fsp_frontend/src/components/bouquet/SelectionControls.jsx`: handles + toolbar.
- ADD `fsp_frontend/src/components/bouquet/BouquetCard/BouquetCard.jsx`: gallery card.
- ADD `fsp_frontend/src/hooks/useBouquetEditor.js`: reducer with history (undo/redo), selection, limits, draft autosave.
- ADD `fsp_frontend/src/utils/bouquetRecipe.js`: schema/version, defaults, validation, clamp, `recipeToSvgString`.
- ADD `fsp_frontend/src/utils/exportBouquetPng.js`: the export pipeline.
- ADD `fsp_frontend/src/services/bouquetService.js`.
- CHANGE `queries/queryKeys.js` (`bouquets`), `queries/queries.js` (`useBouquets`, `useBouquet`), `queries/mutations.js` (`useBouquetMutations`: create/update/delete; invalidates `bouquets`).
- CHANGE `App.jsx` (routes), `pages/HomePage.jsx` + `.module.css` (card).
- CHANGE `components/Icon/glyphs.jsx`: `rose`, `sunflower`, `babysbreath`, `lily`, `leaf`.
- CHANGE `constants/loveBoardCatalog.js`: new flower icons in sticker groups; helper `isBouquetSticker(image)`.
- CHANGE `components/loveBoard/Sticker/Sticker.jsx`: render `bouquet:<id>` stickers via `BouquetCanvas`.
- CHANGE `pages/LoveLettersPage.jsx` / `services/loveBoardService.js`: helper to create the sticker from a bouquet (reuse `createSticker`).
Backend:
- ADD `db/migration/V7__bouquets.sql`.
- ADD `entity/Bouquet.java`, `repository/BouquetRepository.java`, `dto/BouquetDTO.java`, `dto/request/BouquetRequest.java`, `service/BouquetService.java`, `controller/BouquetController.java`.
- CHANGE `service/BulkDeleteService.java`: `deleteLoveBoard()` also removes `bouquet:` stickers (already stickers); bouquets themselves are untouched (they live in the gallery, see edge cases).

## 4. Data
Flyway `V7__bouquets.sql`:
```sql
-- V7: bouquets are small JSON "recipes"; the picture is drawn by the app (SVG) and exported to PNG on demand.
CREATE TABLE IF NOT EXISTS bouquets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       varchar(40)  NOT NULL,
  recipe      jsonb        NOT NULL,        -- see shape below, max ~6 KB
  version     bigint       NOT NULL DEFAULT 0,
  created_by  bigint       NOT NULL,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT bouquets_recipe_size CHECK (pg_column_size(recipe) <= 8192)
);
CREATE INDEX IF NOT EXISTS idx_bouquets_created ON bouquets (created_at DESC);
```
Recipe JSON (schema version 1):
```json
{ "v": 1,
  "wrap": "kraft",
  "ribbon": { "style": "bow", "color": "sea" },
  "items": [
    { "id": "f1", "type": "flower", "name": "rose", "tint": "pink", "x": 188, "y": 150, "r": -12, "s": 1.1, "flip": false },
    { "id": "f2", "type": "flower", "name": "tulip", "tint": "citrus", "x": 226, "y": 160, "r": 14, "s": 1.0, "flip": true },
    { "id": "c1", "type": "card", "x": 300, "y": 390, "r": 8, "s": 1, "paper": "gelato" }
  ],
  "card": { "show": true, "to": "Cj", "from": "Merylle", "text": "Happy anniversary, mahal." }
}
```
Items array order = z-order. Limits enforced server-side: <= 40 items + 1 card; `x` 0-400, `y` 0-500, `r` -180..180, `s` 0.4-2.5; allow-listed names/tints/wrap/ribbon values; text <= 240 chars, to/from <= 24. JPA: `@JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition="jsonb") Map<String,Object> recipe` (or `String` + Jackson), `@Version`.
**Storage**: an item is about 90 bytes of JSON; typical bouquet 12 items + card ~ 1.5-2 KB; hard cap 8 KB (CHECK). **~2 KB per bouquet, ~2 MB per 1,000 bouquets** (cap: 8 MB per 1,000).

## 5. API
Base `/api/v1/bouquets`, `@PreAuthorize("isAuthenticated()")`.
- `GET /api/v1/bouquets` -> `200 [ { "id":"…","title":"Anniversary","recipe":{…},"createdBy":3,"createdByName":"Merylle","createdAt":"…","updatedAt":"…","version":1 } ]` newest first, max 200 (the recipes are small, no pagination needed now).
- `GET /api/v1/bouquets/{id}` -> `200` bouquet; `404`.
- `POST /api/v1/bouquets` `{ "title":"Anniversary","recipe":{…} }` -> `201` bouquet. Errors: `400 {"success":false,"message":"That bouquet has too many flowers (max 40)."}`, `400` invalid recipe values, `413` if recipe > 8 KB.
- `PUT /api/v1/bouquets/{id}` `{ "title":"…","recipe":{…},"version":1 }` -> `200`; `409` stale version; `404`.
- `DELETE /api/v1/bouquets/{id}` -> `204`. Anyone of the two can edit/delete any bouquet (shared); the sticker fallback handles deleted ones.
- Love Board: reuse `POST /api/v1/love-board/stickers` with `{ "image":"bouquet:<uuid>", "positionX":…, "positionY":…, "scale":1.4, … }` (`image` max 120 chars; validate the `bouquet:` prefix + UUID).
- Notification on create: `notifyOthers` with type `SYSTEM` ("Chicken made you a bouquet"), no related entity (see edge cases about the DB CHECK constraints on notification types).

## 6. Edge cases and risks
- **Two people editing the same bouquet**: `version` 409 -> "Cj changed this bouquet. Load their version, or save yours as a copy?" (save-as-copy = POST).
- **Deleting a bouquet that is pinned**: stickers keep `bouquet:<id>`; renderer falls back to the `tulip` icon; optionally the backend `DELETE` also removes stickers with that image (`DELETE FROM love_stickers WHERE image = 'bouquet:'||id`) — recommended, do it in `BouquetService.delete` in the same transaction.
- **Old data**: recipes carry `"v":1`; the renderer ignores unknown fields and drops unknown item names (never crashes), so adding flowers later is backwards compatible. A future `v:2` runs a migrator in `bouquetRecipe.js`.
- **Notification constraints**: the `notifications` table has CHECK constraints on `type` and `related_entity_type` (see `V1__baseline.sql`). To avoid altering them, use `NotificationType.SYSTEM` and no related entity for this feature. Activity log: use the existing generic style; do not add enum values without a migration.
- **Export failures**: SVG-to-image can taint or fail on some iOS versions; fall back to a smaller size, then to `navigator.share`/open-in-tab; always keep fonts loaded before drawing.
- **Fonts in export**: Caveat is a bundled `@fontsource` web font; wait for `document.fonts.ready`.
- **Pinch/drag conflicts with page scroll**: `touch-action: none` only on the canvas; the tool tray scrolls normally; provide button controls for everything.
- **Performance**: <= 41 SVG groups, no filters (use plain shadows); throttle pointer moves via `requestAnimationFrame`; thumbnails render the same SVG (no raster cache needed; gallery virtualisation unnecessary under 200).
- **Delete all**: "Delete all" on the Love Board removes pinned bouquet stickers; **bouquets remain in the gallery** (document in the dialog copy: "Your saved bouquets stay in the gallery."). Gallery gets its own `Button variant="ghost"` "Delete all bouquets" -> `DeleteAllDialog` (`what="all bouquets"`) -> `DELETE /api/v1/bouquets/all` (add to `BulkDeleteController`/`BulkDeleteService`).
- **Tomato rule**: no tomato ribbons/flowers; pink is used instead.
- **Accessibility**: in the gallery and view screens the SVG has `role="img"` with a generated description ("Bouquet of 3 roses, 2 tulips with a sea-blue bow in kraft paper"); in the maker each item is a focusable button.

## 7. Acceptance checklist
- [ ] 390px: maker fits without page scroll jank; canvas gestures work; tool tray tabs usable; all buttons >= 44px; keyboard hidden when typing the card does not cover the canvas.
- [ ] Add, drag, rotate, scale, duplicate, delete, forward/back; undo/redo 50 steps; limits at 40 flowers.
- [ ] Save, reload, edit again (recipe round-trips exactly); gallery shows thumbnails; partner sees them.
- [ ] Export PNG: 2400x3000, light background even in dark mode, letter text readable and wrapped, no clipped flowers.
- [ ] Send to Love Board creates a sticker that renders the bouquet; deleting the bouquet removes/replaces it gracefully; Love Board "delete all" works.
- [ ] Dark mode: tray/gallery readable; artwork unchanged; selection ring visible.
- [ ] Keyboard-only: add a flower with Enter, move with arrows, rotate with `[ ]`, layer with PageUp/Down, delete, undo; every control has an accessible name; item labels announce position in z-order.
- [ ] Reduced motion: no springs or pops; everything still works.
- [ ] Draft restore after killing the tab; "Leave without saving?" works.
- [ ] 4 new flower icons consistent at 24/48/96px; no tomato anywhere in the bouquet UI except the single primary action button.

## 8. Commit title
`Bouquet maker: wrap, ribbon, flowers and a letter card, saved as a small JSON recipe with PNG export and Love Board pin`

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

# FEATURE SPEC (06 · Bouquet maker)

## 1. Goal and user flow
Make a little bouquet picture for each other: pick wrap paper, ribbon and flowers, drag/rotate/scale/layer them with undo, tuck in a handwritten letter card, save it, browse a gallery of "our bouquets", export a high-resolution PNG, and optionally pin it on the Love Board as a sticker. Stored as a small JSON "recipe" (no images in the database, nothing in Drive).

**Flow (phone).** Home -> "Make a bouquet" card -> `/bouquets` gallery (empty: "No bouquets yet, love.") -> "New bouquet" -> maker: the bouquet canvas on top, a tool tray at the bottom with tabs **Wrap · Ribbon · Flowers · Card** -> tap a flower to drop it into the bouquet -> drag it, use the selection handles to rotate/scale, buttons to layer/delete/duplicate -> Undo/Redo any time -> **Card** tab: write the letter -> "Save" (names it) -> gallery -> open a bouquet: **Edit, Export PNG, Send to Love Board, Delete**.

## 2. UX spec

### Routes and entry points
- `/bouquets` (gallery) and `/bouquets/new`, `/bouquets/:id` (view), `/bouquets/:id/edit` (maker), all protected (`ROLE_USER`), lazy loaded. Entry: a Home card **"Say it with flowers"** (Caveat sub-line **"build a bouquet for your person"**, plain `tulip` + `daisy` icons, not a sticker cluster); not added to the 4-item nav. The Love Board "Send to board" and a "Make one" link from the Letters page empty state are optional extras.
- New icons in the kit: `rose`, `sunflower`, `babysbreath`, `lily` (heads only; see drawing guide). `tulip` and `daisy` already exist.

### Gallery (`/bouquets`)
- 390px: header (back to Home, title "Our bouquets", `Button variant="primary"` "New bouquet"), 2-column grid of cards (`--surface`, 2px outline, radius 24, offset shadow `--shadow-sea`); each card shows the live-rendered bouquet (small SVG from the recipe, `aspect-ratio: 4/5`), the title (Shantell), a Caveat line "by Chicken · 12 Oct" with the `her`/`him` doodle 24px. Tap -> view. 1440px: 4-5 columns, max width 1100px.
- States: loading = 4 skeleton cards; empty = `tulip` doodle 96px + **"No bouquets yet, love."** + primary "Make our first one"; error = "Couldn't load the bouquets." + Try again. Reveal: cards stagger in (`slideUp`, 60ms steps, cap 600ms). Hover (desktop): lift `translate(-2px,-2px)` and shadow 8px. Sort newest first; filter chips "All · Mine · Theirs" (`Chip radio`).

### Maker layout
- **390px**: top bar (`IconButton` back/close with "Discard changes?" confirm when dirty; title input "Untitled bouquet"; **Save** `Button size="sm" variant="primary"`), canvas (4:5, full width minus 16px gutters, max height ~52vh, centered, `touch-action: none` on the canvas only), under it the **selection toolbar** (appears only with a selection: Rotate -15, Rotate +15, Smaller, Bigger, Forward, Back, Duplicate, Delete — each a 44px `IconButton` with `aria-label`s, horizontally scrollable) and the global row (**Undo**, **Redo**, **Clear all**), then the **tool tray**: `Tabs` (Wrap · Ribbon · Flowers · Card) with the panel below (tray height ~200px, scrolls vertically).
- **1440px**: three columns: left tool tray (320px), centre canvas (up to 520x650), right "Layers" list (draggable order; same as Forward/Back) + selection inspector.
- Canvas: logical size **400 x 500** SVG viewBox; paper-dotted `--paper-warm` background on screen (the export uses a flat light `#FFF8E8`). The wrap paper is drawn as a cone/fan shape at the bottom-centre (SVG path with a fold line and the paper pattern); stems converge at the "gather point" (200, 340) and are drawn automatically (curved `Q` strokes, 4px `#5E9B4E`, ink outline) from each flower's base to the gather point, **behind** the wrap's front layer so flowers look tucked inside; ribbon wraps at the gather point (band + optional bow).
- **Tool panels**:
  - **Wrap** (6 `RadioGroup` tiles with mini previews): `kraft` (`#E2C98F` with a fold line), `sea-dots` (`--sea-tint` + white dots), `citrus-stripes` (`--citrus-tint` + `--citrus` stripes), `gelato-gingham`, `cloud-white` (white with scalloped edge), `amalfi-stars` (`--amalfi-tint` + tiny white stars). Patterns are SVG `<pattern>`s. Text never sits on these patterns (the card has its own plate).
  - **Ribbon**: style (`bow`, `band`, `none`) as `RadioGroup` + colour `ColorSwatchGroup` (`sea`, `citrus`, `gelato`, `amalfi`, `white`, `pink #FF8FB1`; **no tomato**). The bow squashes/pops in when chosen (spring `{380, 16}`).
  - **Flowers**: grid of 6 tiles (tulip, daisy, rose, sunflower, babysbreath, lily), each with a colour variant row (2-3 tints per flower: e.g. tulip `citrus/sea-tint/white`, rose `pink/gelato/white`; variants are palette-driven fills passed to the flower renderer). Tapping a tile adds that flower near the gather point at a fan angle (-35 to +35deg, alternating sides) with a small drop spring (`{380, 18}`) and selects it. Limit **40 flowers** (toast "That's a full bouquet, love."). Plus **Leaf** (`leaf` filler, free) and `babysbreath` as "filler".
  - **Card** tab: `Field` textarea "Write something sweet" (max **240 chars**, counter, Caveat font preview), optional "To" and "From" (max 24 each, default "To: ___ / From: Chicken|Junebug" based on the signed-in user), card paper `RadioGroup` (`gelato`, `sea`, `citrus`, `lined`; reuse `PAPERS` from `constants/loveBoardCatalog.js`), toggle "Show the card in the picture" (on by default). The card is a draggable item (`type: 'card'`, 120 x 150 px logical, tucked at bottom-right, tilted +8deg) that displays the first ~60 characters in Caveat; tapping it in view mode opens the full letter in a `Modal`. The PNG export includes the full letter text on the card (wrapped, shrunk to fit), up to 240 chars.
- **Interaction details**:
  - Drag: pointer events on the item (`useCanvasDrag` from `hooks/useCanvasDrag.js` is reusable for pointer-capture drag; the maker needs its own SVG coordinate conversion via `svg.getScreenCTM().inverse()`); items stay within the canvas rect (clamped).
  - Selection ring: dashed `--outline` rounded box with 3 handles at 44px hit size (visual 18px): **rotate** (top, circular arrow), **scale** (bottom-right corner), **delete** (top-left, X). Two-finger pinch/rotate on a selected item (Pointer Events with two pointers); mouse wheel + Alt rotates on desktop.
  - Layering: z-order is the array order; Forward/Back swap one step, Shift+Forward = to front, Shift+Back = to back. "Layers" list (desktop) and an accessible "Layer order" list in a `Modal` on phones (rows with Up/Down buttons).
  - **Undo/Redo**: immutable snapshots of the recipe pushed on "commit" events (drag end, rotate end, add, delete, colour change, text blur) not on every pointer move; stack depth 50; coalesce changes within 400ms of the same item/property. Buttons disabled when empty (`aria-disabled`). `Ctrl/Cmd+Z`, `Ctrl/Cmd+Shift+Z`/`Ctrl+Y`.
  - Keyboard (when an item is selected): arrows nudge 4 logical px (Shift 16), `[` / `]` rotate -5/+5deg, `-` / `+` scale, `PageUp`/`PageDown` layer, `Delete`/`Backspace` remove, `D` duplicate, `Tab` cycles items in layer order, `Esc` deselects. Items are `role="button"` `tabindex="0"` `aria-label="Rose, flower 3 of 12, selected"`.
  - Feedback: selection pop (`scale 1.06` for 120ms), delete = quick shrink-fade 160ms, new flower drop-in. Reduced motion: no springs, no pop, instant placement.
- **Dirty state**: navigating away with unsaved changes -> `ConfirmDialog` "Leave without saving?" (Stay / Leave). Autosave draft to `localStorage['fsp-bouquet-draft']` every 2s (so a crashed tab can restore: banner "Pick up where you left off?").
- **Save**: title required (1-40, default "Untitled bouquet" prompts a rename `Field`), `Button primary` "Save bouquet" (busy "Saving…"); success toast `success` "Saved to our bouquets"; error toast "Couldn't save. Your bouquet is still here."
- **View screen** (`/bouquets/:id`): big bouquet (max 520px), title, by/when, buttons: `Edit` (secondary), `Export PNG` (secondary), `Send to Love Board` (primary — the single tomato button), `Delete` (ghost danger -> ConfirmDialog "Throw this bouquet away?"). The letter card opens on tap.
- **Export PNG**: client-side, high resolution **2400 x 3000 px** (6x logical), light background `#FFF8E8`, forced light palette regardless of theme. Method (no new dependency): serialize the bouquet `<svg>` with all colours **inlined as hex** (resolve `var(--x)` to the light values before serializing) -> `Blob` (`image/svg+xml`) -> `Image` -> draw on a `<canvas>` 2400x3000 with `imageSmoothingQuality='high'` -> draw the letter text with canvas `fillText` using `await document.fonts.load('48px Caveat')` first (web fonts do not load inside SVG-as-image) -> `canvas.toBlob('image/png')` -> download `bouquet-<slug>.png`; on iOS Safari use `navigator.share({files})` when available else open the blob URL. Memory ~ 2400x3000x4 = 29 MB: acceptable; fall back to 1600x2000 on failure. A thin 8px `#FFF8E8` margin and a tiny footer "for sneakypea" in Caveat at 40% opacity. Toast "Saved your bouquet picture".
- **Send to Love Board**: creates a Love Board **sticker** (existing `love_stickers` table; `image` is `varchar(120)`) with `image = "bouquet:<bouquetId>"`, default position near the board centre, scale 1.4. The Love Board's `Sticker.jsx` resolves `bouquet:<id>` by reading the bouquet from the `useBouquets()` cache (fetch the list once; the recipe is small) and renders the same SVG at sticker size (no `sticker` plate, a soft drop shadow like a paper cut-out). If the bouquet was deleted, the sticker renders the `tulip` icon. Button copy: **"Pin to the Love Board"**; success toast "Pinned! Go see it on the board." with a "Go to board" action text link. Allowed from the view screen only (needs a saved id).
- Dark mode: tool tray and gallery follow tokens; the canvas surface follows the theme but the bouquet artwork itself (paper, flowers, ribbon) is the same in both themes; the canvas gets a `--paper-warm` backdrop and a subtle inner outline so the light wrap paper reads on navy.

### New flower drawing guide (add to `GLYPHS`, heads only, 64x64, same style as the kit)
Same rules as the food doodles in commit 04 (flat fills, ink stroke from the wrapper, <= 8 shapes, one white highlight, slightly wobbly). Heads are centred at (32, 28) so the renderer can attach a stem at (32, 52). Starter drawings:
- `rose`: outer petals `M32 10 C16 10 10 26 18 38 C24 48 40 48 46 38 C54 26 48 10 32 10 Z` fill pink `#FF8FB1`; inner spiral `M32 20 C26 20 24 28 30 30 C36 32 40 26 36 22 C34 20 30 22 31 26` stroke only; two small curved petal lines on the sides; tiny white highlight arc top-left; 2 small green sepals at the base `#5E9B4E`.
- `sunflower`: 12 petals as rounded triangles around a centre (each `M32 6 L36 18 L28 18 Z` rotated in 30deg steps) fill `#FFE680` with ink outlines; centre circle r=9 fill `#8A4B2A` with 5 dots `#172B70`; one white highlight on a petal.
- `babysbreath`: a loose spray: 3 thin branching strokes from the base `(32,52)` (ink) and 9 tiny circles r=2.6 filled `#FFFFFF` at the tips, 2 filled `#CDE7FF`; no big petals; reads as filler.
- `lily`: six-petal star: three big pointed petals up-left/up/up-right `M32 28 C22 22 18 12 22 6 C28 10 32 18 32 28 Z` (mirror and rotate) fill `#FFF0B3`; three lower recurved petals fill `#FFD8A0`; orange spots (3 dots `#FF9F1C`) on petals; stamens: three short ink lines ending in small dots `#FF9F1C` (no tomato).
- `leaf` (filler, optional): simple almond shape fill `#5E9B4E` with a centre vein.
Colour variants are applied by swapping the main petal fill; the renderer receives `{name, tint}`.

## 3. Files to change / add
Frontend:
- ADD `fsp_frontend/src/pages/BouquetGalleryPage.jsx` + `.module.css`; `BouquetViewPage.jsx`; `BouquetMakerPage.jsx` + `.module.css`.
- ADD `fsp_frontend/src/components/bouquet/BouquetCanvas/BouquetCanvas.jsx` + `.module.css`: the SVG renderer used everywhere (maker, gallery thumbs, view, Love Board sticker). Pure function of the recipe.
- ADD `fsp_frontend/src/components/bouquet/BouquetCanvas/parts.jsx`: wrap shapes + patterns, ribbon shapes, stems, card, flower wrappers (`FlowerHead` using `GLYPHS`).
- ADD `fsp_frontend/src/components/bouquet/ToolTray/*`: `WrapPanel`, `RibbonPanel`, `FlowerPanel`, `CardPanel`.
- ADD `fsp_frontend/src/components/bouquet/SelectionControls.jsx`: handles + toolbar.
- ADD `fsp_frontend/src/components/bouquet/BouquetCard/BouquetCard.jsx`: gallery card.
- ADD `fsp_frontend/src/hooks/useBouquetEditor.js`: reducer with history (undo/redo), selection, limits, draft autosave.
- ADD `fsp_frontend/src/utils/bouquetRecipe.js`: schema/version, defaults, validation, clamp, `recipeToSvgString`.
- ADD `fsp_frontend/src/utils/exportBouquetPng.js`: the export pipeline.
- ADD `fsp_frontend/src/services/bouquetService.js`.
- CHANGE `queries/queryKeys.js` (`bouquets`), `queries/queries.js` (`useBouquets`, `useBouquet`), `queries/mutations.js` (`useBouquetMutations`: create/update/delete; invalidates `bouquets`).
- CHANGE `App.jsx` (routes), `pages/HomePage.jsx` + `.module.css` (card).
- CHANGE `components/Icon/glyphs.jsx`: `rose`, `sunflower`, `babysbreath`, `lily`, `leaf`.
- CHANGE `constants/loveBoardCatalog.js`: new flower icons in sticker groups; helper `isBouquetSticker(image)`.
- CHANGE `components/loveBoard/Sticker/Sticker.jsx`: render `bouquet:<id>` stickers via `BouquetCanvas`.
- CHANGE `pages/LoveLettersPage.jsx` / `services/loveBoardService.js`: helper to create the sticker from a bouquet (reuse `createSticker`).
Backend:
- ADD `db/migration/V7__bouquets.sql`.
- ADD `entity/Bouquet.java`, `repository/BouquetRepository.java`, `dto/BouquetDTO.java`, `dto/request/BouquetRequest.java`, `service/BouquetService.java`, `controller/BouquetController.java`.
- CHANGE `service/BulkDeleteService.java`: `deleteLoveBoard()` also removes `bouquet:` stickers (already stickers); bouquets themselves are untouched (they live in the gallery, see edge cases).

## 4. Data
Flyway `V7__bouquets.sql`:
```sql
-- V7: bouquets are small JSON "recipes"; the picture is drawn by the app (SVG) and exported to PNG on demand.
CREATE TABLE IF NOT EXISTS bouquets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       varchar(40)  NOT NULL,
  recipe      jsonb        NOT NULL,        -- see shape below, max ~6 KB
  version     bigint       NOT NULL DEFAULT 0,
  created_by  bigint       NOT NULL,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT bouquets_recipe_size CHECK (pg_column_size(recipe) <= 8192)
);
CREATE INDEX IF NOT EXISTS idx_bouquets_created ON bouquets (created_at DESC);
```
Recipe JSON (schema version 1):
```json
{ "v": 1,
  "wrap": "kraft",
  "ribbon": { "style": "bow", "color": "sea" },
  "items": [
    { "id": "f1", "type": "flower", "name": "rose", "tint": "pink", "x": 188, "y": 150, "r": -12, "s": 1.1, "flip": false },
    { "id": "f2", "type": "flower", "name": "tulip", "tint": "citrus", "x": 226, "y": 160, "r": 14, "s": 1.0, "flip": true },
    { "id": "c1", "type": "card", "x": 300, "y": 390, "r": 8, "s": 1, "paper": "gelato" }
  ],
  "card": { "show": true, "to": "Cj", "from": "Merylle", "text": "Happy anniversary, mahal." }
}
```
Items array order = z-order. Limits enforced server-side: <= 40 items + 1 card; `x` 0-400, `y` 0-500, `r` -180..180, `s` 0.4-2.5; allow-listed names/tints/wrap/ribbon values; text <= 240 chars, to/from <= 24. JPA: `@JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition="jsonb") Map<String,Object> recipe` (or `String` + Jackson), `@Version`.
**Storage**: an item is about 90 bytes of JSON; typical bouquet 12 items + card ~ 1.5-2 KB; hard cap 8 KB (CHECK). **~2 KB per bouquet, ~2 MB per 1,000 bouquets** (cap: 8 MB per 1,000).

## 5. API
Base `/api/v1/bouquets`, `@PreAuthorize("isAuthenticated()")`.
- `GET /api/v1/bouquets` -> `200 [ { "id":"…","title":"Anniversary","recipe":{…},"createdBy":3,"createdByName":"Merylle","createdAt":"…","updatedAt":"…","version":1 } ]` newest first, max 200 (the recipes are small, no pagination needed now).
- `GET /api/v1/bouquets/{id}` -> `200` bouquet; `404`.
- `POST /api/v1/bouquets` `{ "title":"Anniversary","recipe":{…} }` -> `201` bouquet. Errors: `400 {"success":false,"message":"That bouquet has too many flowers (max 40)."}`, `400` invalid recipe values, `413` if recipe > 8 KB.
- `PUT /api/v1/bouquets/{id}` `{ "title":"…","recipe":{…},"version":1 }` -> `200`; `409` stale version; `404`.
- `DELETE /api/v1/bouquets/{id}` -> `204`. Anyone of the two can edit/delete any bouquet (shared); the sticker fallback handles deleted ones.
- Love Board: reuse `POST /api/v1/love-board/stickers` with `{ "image":"bouquet:<uuid>", "positionX":…, "positionY":…, "scale":1.4, … }` (`image` max 120 chars; validate the `bouquet:` prefix + UUID).
- Notification on create: `notifyOthers` with type `SYSTEM` ("Chicken made you a bouquet"), no related entity (see edge cases about the DB CHECK constraints on notification types).

## 6. Edge cases and risks
- **Two people editing the same bouquet**: `version` 409 -> "Cj changed this bouquet. Load their version, or save yours as a copy?" (save-as-copy = POST).
- **Deleting a bouquet that is pinned**: stickers keep `bouquet:<id>`; renderer falls back to the `tulip` icon; optionally the backend `DELETE` also removes stickers with that image (`DELETE FROM love_stickers WHERE image = 'bouquet:'||id`) — recommended, do it in `BouquetService.delete` in the same transaction.
- **Old data**: recipes carry `"v":1`; the renderer ignores unknown fields and drops unknown item names (never crashes), so adding flowers later is backwards compatible. A future `v:2` runs a migrator in `bouquetRecipe.js`.
- **Notification constraints**: the `notifications` table has CHECK constraints on `type` and `related_entity_type` (see `V1__baseline.sql`). To avoid altering them, use `NotificationType.SYSTEM` and no related entity for this feature. Activity log: use the existing generic style; do not add enum values without a migration.
- **Export failures**: SVG-to-image can taint or fail on some iOS versions; fall back to a smaller size, then to `navigator.share`/open-in-tab; always keep fonts loaded before drawing.
- **Fonts in export**: Caveat is a bundled `@fontsource` web font; wait for `document.fonts.ready`.
- **Pinch/drag conflicts with page scroll**: `touch-action: none` only on the canvas; the tool tray scrolls normally; provide button controls for everything.
- **Performance**: <= 41 SVG groups, no filters (use plain shadows); throttle pointer moves via `requestAnimationFrame`; thumbnails render the same SVG (no raster cache needed; gallery virtualisation unnecessary under 200).
- **Delete all**: "Delete all" on the Love Board removes pinned bouquet stickers; **bouquets remain in the gallery** (document in the dialog copy: "Your saved bouquets stay in the gallery."). Gallery gets its own `Button variant="ghost"` "Delete all bouquets" -> `DeleteAllDialog` (`what="all bouquets"`) -> `DELETE /api/v1/bouquets/all` (add to `BulkDeleteController`/`BulkDeleteService`).
- **Tomato rule**: no tomato ribbons/flowers; pink is used instead.
- **Accessibility**: in the gallery and view screens the SVG has `role="img"` with a generated description ("Bouquet of 3 roses, 2 tulips with a sea-blue bow in kraft paper"); in the maker each item is a focusable button.

## 7. Acceptance checklist
- [ ] 390px: maker fits without page scroll jank; canvas gestures work; tool tray tabs usable; all buttons >= 44px; keyboard hidden when typing the card does not cover the canvas.
- [ ] Add, drag, rotate, scale, duplicate, delete, forward/back; undo/redo 50 steps; limits at 40 flowers.
- [ ] Save, reload, edit again (recipe round-trips exactly); gallery shows thumbnails; partner sees them.
- [ ] Export PNG: 2400x3000, light background even in dark mode, letter text readable and wrapped, no clipped flowers.
- [ ] Send to Love Board creates a sticker that renders the bouquet; deleting the bouquet removes/replaces it gracefully; Love Board "delete all" works.
- [ ] Dark mode: tray/gallery readable; artwork unchanged; selection ring visible.
- [ ] Keyboard-only: add a flower with Enter, move with arrows, rotate with `[ ]`, layer with PageUp/Down, delete, undo; every control has an accessible name; item labels announce position in z-order.
- [ ] Reduced motion: no springs or pops; everything still works.
- [ ] Draft restore after killing the tab; "Leave without saving?" works.
- [ ] 4 new flower icons consistent at 24/48/96px; no tomato anywhere in the bouquet UI except the single primary action button.

# FILES I WILL PASTE BELOW
Frontend (shared, to reuse):
- fsp_frontend/src/components/ui/Modal/Modal.jsx and Modal.module.css
- fsp_frontend/src/components/ui/ConfirmDialog/ConfirmDialog.jsx
- fsp_frontend/src/components/ui/DeleteAllDialog/DeleteAllDialog.jsx
- fsp_frontend/src/components/ui/Button/Button.jsx and Button.module.css
- fsp_frontend/src/components/ui/IconButton/IconButton.jsx and IconButton.module.css
- fsp_frontend/src/components/ui/Tabs/Tabs.jsx and Tabs.module.css
- fsp_frontend/src/components/ui/Chip/Chip.jsx
- fsp_frontend/src/components/ui/Field/Field.jsx and fsp_frontend/src/components/ui/FormControls.module.css
- fsp_frontend/src/components/ui/RadioGroup/RadioGroup.jsx and RadioGroup.module.css (ColorSwatchGroup)
- fsp_frontend/src/components/Icon/Icon.jsx and glyphs.jsx (paste whole files; add 5 glyphs without touching existing ones)
- fsp_frontend/src/hooks/useCanvasDrag.js
- fsp_frontend/src/constants/animations.js
- fsp_frontend/src/constants/loveBoardCatalog.js
- fsp_frontend/src/hooks/useNotification.js
- fsp_frontend/src/styles/design-tokens.css
Frontend (related, to change):
- fsp_frontend/src/App.jsx
- fsp_frontend/src/pages/HomePage.jsx and HomePage.module.css
- fsp_frontend/src/components/loveBoard/Sticker/Sticker.jsx
- fsp_frontend/src/services/loveBoardService.js
- fsp_frontend/src/pages/LoveLettersPage.jsx (only the sticker creation part; paste the whole file if short enough, otherwise the relevant functions)
- fsp_frontend/src/queries/queryKeys.js
- fsp_frontend/src/queries/queries.js
- fsp_frontend/src/queries/mutations.js
Backend (reference + to change):
- fsp_backend/src/main/resources/db/migration/V1__baseline.sql (love_stickers and notifications CHECK constraints; paste only those table definitions)
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/entity/LoveSticker.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/service/LoveBoardService.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/controller/BulkDeleteController.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/service/BulkDeleteService.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/service/NotificationService.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/entity/NotificationType.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/controller/MenuController.java and entity/MenuItem.java (from commit 04, style reference)

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
