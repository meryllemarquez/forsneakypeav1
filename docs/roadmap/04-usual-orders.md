# 04 · "Our usual orders": a mini resto menu on Home

## 1. Goal and user flow
Turn the static "Our usual orders" strip on Home (today the constant `USUAL_ORDERS` in `HomePage.jsx`, section `home-orders`) into a living, shared menu: a cute restaurant counter with a menu folder that opens with a book animation, foods appearing one by one, and full add / edit / delete / reorder that both of us share. Also adds 8 new food doodles to the Icon kit.

**Flow (phone first).**
1. Home -> scroll to the counter scene "Our usual orders" (awning, little sign, the menu folder on the counter).
2. Tap the folder -> it opens (cover swings open left, 0.7s) -> a menu sheet slides up with the foods popping in one by one.
3. Browse; filter chips "All / Hers / His / Both".
4. "Add to the menu" -> form (name, doodle, who loves it, place, price, note) -> Save -> the new food pops in at the bottom (or top) of the list.
5. Tap a food -> edit sheet; "Remove from the menu" asks a ConfirmDialog.
6. "Reorder" -> drag handles (or up/down buttons) -> new order saved for both.
7. Close the menu -> folder closes with a soft squash.

## 2. UX spec

### Home counter scene (`UsualOrdersCounter`)
- 390px: full-width card (`--surface`, 2px outline, `--radius-card-lg`, `--shadow-card`), height ~220px. Content: a striped awning (CSS: repeating `--citrus`/`--white` stripes with a scalloped bottom edge via `radial-gradient`), a hanging wooden-style sign on the left built as a Caveat label plate "open · all day" (text on a `--white` plate, never on stripes), a counter slab (`--amalfi-tint` with ink outline) and on it: the **menu folder** (a 96x120 CSS/SVG folder in `--amalfi` with a `--gelato` label reading "menu" in Caveat, tilted -4deg), plus up to 3 tiny food doodles (`Icon` size 36: the first 3 foods) sitting on the counter. A caption in Caveat: **"tap the menu, love"**. The sticker rule: this scene is NOT a sticker cluster; the foods are plain icons (no `sticker`).
- 1440px: the card sits in the two-column area under "Recent notes" or full width below the hero (keep the section position of `home-orders`), max-width 1100px, scene on the left 55%, a preview list of the first 4 foods (name + loved-by dots) on the right 45%, "Open the menu" `Button variant="primary"`.
- Idle micro-interaction: the folder gently floats (`y 0 <-> -4px`, 3.2s ease-in-out loop) and the awning swings 0.6deg; both stop on reduced motion. Hover (desktop): folder lifts `y:-6`, tilt 0.
- Tap: folder `scale 0.96` (80ms) then opens.
- States: loading = counter with a "…" sign and the folder greyed (`aria-busy`); error = sign "closed for a sec", folder disabled, `Button size="sm"` "Try again"; empty = sign "new menu", caption "add our first usual"; success = nothing special.

### Menu sheet (`MenuBook`)
- Container: `Modal` (`title="Our usual orders"`, `size="lg"`) that on phones fills the screen (CSS override in the module). The sheet is styled as a menu card: `--paper-warm` page, dashed `--line-soft` divider rules, header with a small `utensils` doodle, a Caveat sub-line **"what we always end up ordering"**.
- **Opening animation** (framer-motion, `AnimatePresence`): (a) a folder-cover element (same look as the counter folder) rotates `rotateY 0 -> -160deg` around its left edge (`transform-origin: left`, `perspective: 900px`) in 0.7s with spring `{stiffness: 120, damping: 16}` while the menu page scales `0.92 -> 1` and fades in (0.4s expo-out `[0.16,1,0.3,1]`), then the cover fades out. (b) Foods appear one by one: each row `initial {opacity:0, y:14, scale:.94, rotate:-1.5}` -> `animate {1,0,1,0}` with spring `{type:'spring', stiffness:380, damping:20}`, `delay = 0.35 + i*0.09` (cap the total stagger at 1.2s; items beyond the 12th appear together). Closing: reverse in 0.35s. Reduced motion: no rotation or stagger, the sheet simply fades in (150ms) and all foods are visible.
- Toolbar (sticky top, `--paper-warm`): filter `Chip`s "All · Hers · His · Both" (`radio`), `IconButton label="Reorder"` (lucide `ArrowUpDown`), and `Button size="sm" variant="primary"` **"Add to the menu"** (the one tomato button).
- Food row (min height 72px; one column on phones, two columns >= 900px): left a `sticker` doodle (size 52, tilt alternating -4/+4deg), centre name (Shantell 800, 1.05rem, wraps up to 2 lines) + line 2 in Caveat: `place` and `₱price` joined by " · " (omit missing parts), a note preview (1 line) under it; right: loved-by badge (`her` doodle 28px / `him` 28px / both overlapping), and a "more" `IconButton label="More options for <name>"` (lucide `MoreHorizontal`) opening a small menu (Edit, Move up, Move down, Remove). The whole row is also a button that opens Edit.
- Empty state: `utensils` doodle size 96, **"The menu is empty."** / Caveat **"what do we always order?"**, primary button "Add our first usual". Loading: 4 skeleton rows (pulse 1.4s). Error: inline card **"Couldn't open the menu."** + "Try again".
- **Reorder mode**: toggled by the Reorder button (button label becomes "Done"). Rows show a drag handle (lucide `GripVertical`, 44px tap target) and Up/Down `IconButton`s (these are the keyboard/screen-reader path). Drag uses framer-motion `Reorder.Group axis="y"` + `Reorder.Item` (already in framer-motion, no new dependency) with `whileDrag {scale:1.03, boxShadow: offset}` and spring `{300, 22}`. On drop (or after 600ms of no change when using buttons) one `PUT /menu-items/order` is sent. Optimistic update; on failure toast "Couldn't save the new order." and revert.
- Filters hide rows with CSS-less logic (client side). Reorder is disabled while a filter other than "All" is on (hint: "Switch to All to reorder").

### Add / Edit form (`MenuItemForm`, a nested `Modal size="md"`)
- Fields (all `Field` + shared controls): **Name** (required, 1-60 chars, placeholder "Mr. B bulalo"), **Doodle** (`RadioGroup variant="tile"`, grid of food doodles: `matcha cookie yogurt fries churro lasagna pizza donut bowl lechon utensils` + the 8 new ones, 56px tiles, 4 per row on phones; selected = ink ring; accessible names "Matcha", "Burger", ...), **Who loves it?** (`RadioGroup variant="tile"` three tiles: `her` "Hers", `him` "His", both "Both of us"; default Both), **Where?** (optional text, 80), **Price** (optional number input `inputmode="numeric"`, prefix "₱", 0-99,999), **Note** (optional textarea 200, Caveat placeholder "extra shot, no ice…").
- Buttons: `Button variant="primary"` "Save to the menu" (busy: "Saving…"), `Button variant="ghost"` "Cancel"; edit mode adds `Button variant="danger"` "Remove from the menu" (ConfirmDialog `danger`, title "Take it off the menu?", message "<name> will be gone for both of us.").
- Validation messages: "Give it a name, love." / "That price looks off." Inline under fields (`Field error`). Server 409: "<Partner name> just changed this one. Reload to see their version?" with a "Reload" button.
- Keyboard: Enter in name submits; Escape closes (confirm if dirty: "Discard changes?"); tile groups use arrow keys.

### Proposed new food doodles (add to `GLYPHS`, 64x64, same style)
Style rules for ALL: viewBox 0 0 64 64; the wrapper already sets `fill="none" stroke=currentColor(ink) stroke-width 2.6 round caps/joins`; every closed shape gets one flat fill from the palette (no gradients, no shadows); at most 6-8 shapes; one tiny highlight line or dot in `#FFFFFF`; keep shapes slightly wobbly/rounded (use `C` curves, avoid perfect circles except eyes); optional kawaii face is NOT used on foods (faces are reserved for characters). Colours: `#FFC76B` (bun/pastry), `#FFE680` (cheese/butter), `#FF9F1C` (orange accents), `#E0301A` (red details), `#5CB3FF` (cold/glass), `#CDE7FF` (ice/milk), `#5E9B4E` (greens), `#8A4B2A` (meat/chocolate), `#FFFFFF` highlights. Starter drawings (refine by eye at 24/48/96px):
- `burger`: top bun `M10 30 C10 15 54 15 54 30 Z` fill `#FFC76B`; 3 sesame ticks (short strokes at (24,22) (32,19) (40,23)); lettuce wave `M8 33 Q14 38 20 33 T32 33 T44 33 T56 33 V35 H8 Z` fill `#5E9B4E`; patty `rect x9 y36 w46 h7 rx3.5` fill `#8A4B2A`; cheese triangle `M14 43 L22 49 L30 43 Z` fill `#FFE680`; bottom bun `M10 45 H54 Q54 53 46 53 H18 Q10 53 10 45 Z` fill `#FFC76B`.
- `ramen`: bowl `M8 30 H56 C56 46 46 55 32 55 C18 55 8 46 8 30 Z` fill `#FFFFFF`; broth line ellipse inside top (`M10 30 C20 34 44 34 54 30`) fill `#FF9F1C`; 3 wavy noodle strokes rising `M20 30 Q24 22 28 30 M30 30 Q34 20 38 30 M40 30 Q44 23 48 30`; egg half circle `M36 26 a6 6 0 0 1 12 0` fill `#FFE680` with a `#FF9F1C` dot yolk; chopsticks two diagonal lines from (44,6) to (30,26) and (50,8) to (36,27).
- `milkTea`: cup tapered `M16 20 L20 56 H44 L48 20 Z` fill `#CDE7FF`; tea level `M18 32 L20 56 H44 L46 32 Z` fill `#C99A6B`; dome lid `M14 20 C14 10 50 10 50 20 Z` fill `#FFFFFF`; fat straw `M36 4 L40 22` stroke thick (width 4) in `#E0301A`; 4 boba circles r2.4 filled `#172B70` at the bottom.
- `iceCream`: cone `M20 30 L32 58 L44 30 Z` fill `#FFC76B` with a diamond lattice (2 crossing line pairs); scoop 1 `C` blob `M16 30 C14 14 50 14 48 30 Z` fill `#FF8FB1`; scoop 2 smaller on top fill `#FFFFFF`; cherry circle r3.5 `#E0301A` + stem line; drip bump on the lower edge.
- `cake`: plate ellipse base `#CDE7FF`; two-layer slice `M10 34 L54 34 L54 52 L10 52 Z` rounded; layers: sponge `#FFE680`, cream `#FFFFFF` wavy band, frosting top `M10 34 C14 26 20 30 24 26 C30 30 36 26 40 30 C46 26 50 30 54 34 Z` fill `#FF8FB1`; candle rect `#5CB3FF` with a flame teardrop `#FF9F1C`.
- `sushi`: nigiri: rice oval `M10 40 C10 30 54 30 54 40 C54 50 10 50 10 40 Z` fill `#FFFFFF` with 3 grain dots; salmon topping `M12 36 C20 24 44 24 52 36 C44 34 20 34 12 36 Z` fill `#FF9F1C` with 2 white stripes; nori band `rect x28 y28 w8 h22` fill `#2B3A55` (a dark navy-grey) with an ink outline.
- `coffee`: mug `M12 24 H44 V44 C44 52 38 56 28 56 C18 56 12 52 12 44 Z` fill `#FFFFFF`; handle `M44 28 C54 28 54 42 44 42` ; coffee surface ellipse `#8A4B2A`; heart latte art in `#FFE680` tiny; 2 steam curls above `M22 18 C18 12 26 10 22 4 M32 18 C28 12 36 10 32 4`; saucer line.
- `siomai`: steamer base ellipse `#C99A6B` with wooden slat lines; dumpling: wrapper `M16 38 C16 24 28 20 32 24 C36 20 48 24 48 38 Z` fill `#FFE680` with 5 little pleat lines on top and an orange dot (carrot) at the crown `#FF9F1C`; second smaller dumpling behind; bamboo lid hint on the left.
Add all eight to `STICKER_GROUPS` in `constants/loveBoardCatalog.js` under the "Us" group so they appear as Love Board stickers, add them to the album doodle list automatically (`PICKABLE_DOODLES = ICON_NAMES - her/him`), and preview them on `/dev/icons`.

### Seed content (first run)
Inserted by the Flyway migration, in this order, `sort_order` 1000, 2000, … : matcha (**her**, doodle `matcha`), cookies & cream (**him**, `cookie`), Yowell (both, `yogurt`), yogurt + fries (both, `fries`), churros (both, `churro`), lasagna (both, `lasagna`), Angel's spinach pizza (both, `pizza`, place "Angel's"), Alcapone & Boston creme donuts (both, `donut`), lechon pares (both, `lechon`), Mr. B bulalo (both, `bowl`). Only matcha and cookies & cream were specified as hers/his, everything else defaults to "both"; they can edit.

### Dark mode, copy tone
Menu page uses `--paper-warm`/`--surface`, awning stripes `--citrus`/`--surface`, doodles use `--icon-ink`. Warm copy only: "Nothing here yet, love." "Added to the menu." (success toast), "Took it off the menu." (info toast).

## 3. Files to change / add
Frontend:
- ADD `fsp_frontend/src/components/home/UsualOrdersCounter/UsualOrdersCounter.jsx` + `.module.css`: the counter scene and the folder.
- ADD `fsp_frontend/src/components/home/MenuBook/MenuBook.jsx` + `.module.css`: the opening menu sheet, rows, reorder.
- ADD `fsp_frontend/src/components/home/MenuBook/MenuItemForm.jsx`: add/edit form.
- ADD `fsp_frontend/src/services/menuService.js`: axios calls.
- CHANGE `fsp_frontend/src/queries/queryKeys.js` (`menuItems`), `queries/queries.js` (`useMenuItems`), `queries/mutations.js` (`useMenuMutations`: create/update/delete/reorder with optimistic cache updates).
- CHANGE `fsp_frontend/src/pages/HomePage.jsx` + `HomePage.module.css`: remove the `USUAL_ORDERS` constant and old strip; mount `UsualOrdersCounter`.
- CHANGE `fsp_frontend/src/components/Icon/glyphs.jsx`: 8 new glyphs.
- CHANGE `fsp_frontend/src/constants/loveBoardCatalog.js`: add new icons to the "Us" sticker group.
- CHANGE `fsp_frontend/src/dev/IconCheck.jsx`: only if it lists names manually.
- ADD `fsp_frontend/src/constants/menuOptions.js`: `FOOD_DOODLES` (ordered list), `LOVED_BY` options.
Backend:
- ADD `fsp_backend/src/main/resources/db/migration/V5__menu_items.sql` (table + seed).
- ADD `entity/MenuItem.java`, `repository/MenuItemRepository.java`, `dto/MenuItemDTO.java`, `dto/request/MenuItemRequest.java`, `dto/request/MenuReorderRequest.java`, `service/MenuService.java`, `controller/MenuController.java`.
- NOTE (no file change): notifications use the existing `NotificationType.SYSTEM` with no related entity, because the `notifications` table has CHECK constraints on `type` and `related_entity_type` (see `V1__baseline.sql`). Do NOT add enum values without a Flyway migration that alters those constraints.

## 4. Data
Flyway `V5__menu_items.sql`:
```sql
-- V5: "Our usual orders": the shared menu of foods we always get.
CREATE TABLE IF NOT EXISTS menu_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        varchar(60)  NOT NULL,
  doodle      varchar(24)  NOT NULL DEFAULT 'utensils',
  loved_by    varchar(4)   NOT NULL DEFAULT 'both' CHECK (loved_by IN ('her','him','both')),
  place       varchar(80),
  price_php   integer      CHECK (price_php IS NULL OR (price_php >= 0 AND price_php <= 99999)),
  note        varchar(200),
  sort_order  integer      NOT NULL,
  version     bigint       NOT NULL DEFAULT 0,
  created_by  bigint,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_menu_items_sort ON menu_items (sort_order);

INSERT INTO menu_items (name, doodle, loved_by, place, sort_order)
SELECT v.name, v.doodle, v.loved_by, v.place, v.sort_order FROM (VALUES
  ('matcha',                          'matcha',  'her',  NULL,       1000),
  ('cookies & cream',                 'cookie',  'him',  NULL,       2000),
  ('Yowell',                          'yogurt',  'both', NULL,       3000),
  ('yogurt + fries',                  'fries',   'both', NULL,       4000),
  ('churros',                         'churro',  'both', NULL,       5000),
  ('lasagna',                         'lasagna', 'both', NULL,       6000),
  ('Angel''s spinach pizza',          'pizza',   'both', 'Angel''s', 7000),
  ('Alcapone & Boston creme donuts',  'donut',   'both', NULL,       8000),
  ('lechon pares',                    'lechon',  'both', NULL,       9000),
  ('Mr. B bulalo',                    'bowl',    'both', NULL,      10000)
) AS v(name, doodle, loved_by, place, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM menu_items);
```
Entity `MenuItem` (`@Version Long version`, `@Column(name="price_php") Integer pricePhp`, etc., `OffsetDateTime` timestamps like other entities). DTO `MenuItemDTO { id, name, doodle, lovedBy, place, pricePhp, note, sortOrder, version, createdAt, updatedAt }`.
`doodle` is validated server-side against an allow-list constant (the icon names) to avoid junk; unknown -> `utensils`.
**Storage**: about 200 bytes per item (name 30 + place 20 + note 40 + overhead). **~0.2 KB per item; ~200 KB per 1,000 items.** (Realistic size: under 100 items.)
Reorder uses spaced integers (steps of 1000, midpoint insert; renumber all only when the gap closes), so a drag writes 1 row, not N.

## 5. API
All `@PreAuthorize("isAuthenticated()")`, base `/api/v1/menu-items`.
- `GET /api/v1/menu-items` -> `200 [ {"id":"…","name":"matcha","doodle":"matcha","lovedBy":"her","place":null,"pricePhp":null,"note":null,"sortOrder":1000,"version":0,"createdAt":"…","updatedAt":"…"} ]` sorted by `sortOrder`.
- `POST /api/v1/menu-items` body `{ "name":"Ramen night", "doodle":"ramen", "lovedBy":"both", "place":"Ramen Nagi", "pricePhp":420, "note":"extra egg", "afterId":"<uuid>|null" }` -> `201` item (`afterId` null = last). Errors: `400 {"success":false,"message":"Give it a name."}`.
- `PUT /api/v1/menu-items/{id}` body same fields + `"version":3` -> `200` item with `version` incremented; `404`; `409 {"success":false,"message":"This was just changed by someone else."}` when versions differ.
- `DELETE /api/v1/menu-items/{id}` -> `204`; `404`.
- `PUT /api/v1/menu-items/order` body `{ "ids": ["uuid1","uuid2", …] }` (full order) -> `200` the reordered list; `400` if ids do not match the existing set (client must refetch).
Notifications: create/delete call `notifyOthers` (type `SYSTEM`, no related entity) ("Chicken added ramen to our usual orders"); updates and reorder do not notify.
Activity log: reuse `activityLogService.log(...)` with action names `MENU_ITEM_CREATED/UPDATED/DELETED` and no new `RelatedEntityType` value (check any `activity_logs` constraints in `V1__baseline.sql` before adding one).

## 6. Edge cases and risks
- **Two people editing at once**: optimistic `version` -> 409 -> friendly reload prompt; reorder by both at the same time: last full-order write wins; the other sees it on refetch (add `refetchOnWindowFocus` default behaviour, `staleTime 30s`).
- **Deleting an item someone else is editing**: edit save returns 404 -> "That one was taken off the menu." and close the form.
- **Old data**: first deploy seeds only if the table is empty (`WHERE NOT EXISTS`). If the Flyway baseline-on-migrate behaviour re-runs on an old DB it is idempotent.
- **Reorder while filtered**: disabled to avoid reordering a subset incorrectly.
- **Price**: whole pesos only; display with `toLocaleString('en-PH')`.
- **Doodle not in the Icon kit** (renamed later): `Icon` returns null; fall back to `utensils` when `GLYPHS[name]` is missing.
- **Delete all**: the menu is curated shared data and is NOT wiped by the existing three "delete all" actions; state this in the Profile/Admin copy if relevant. (Admin "delete all" dialogs list what they delete; menu is not in the list.)
- **No Drive involvement**; no images stored.
- **Animation cost**: ~10-40 rows with springs is fine; cap stagger; `will-change: transform` only during the opening.
- **Accessibility of drag**: always provide the Up/Down buttons.

## 7. Acceptance checklist
- [ ] 390px: counter scene fits, no horizontal scroll; folder is a 44px+ tap target; menu opens full-screen; rows readable; "Add to the menu" reachable with one thumb.
- [ ] Opening animation: folder swings, foods pop one by one; closing is quick.
- [ ] Add, edit, delete, reorder (drag and buttons) all persist and show up for the partner after refetch; partner gets one notification for add/delete.
- [ ] Seeded 10 foods appear exactly once, matcha hers, cookies & cream his.
- [ ] Dark mode: counter, awning, menu page, tiles all readable; doodles outlined with `--icon-ink`.
- [ ] Keyboard: open folder (Enter/Space), tab through rows, Enter edits, Escape closes, reorder with Up/Down buttons, focus returns to the folder.
- [ ] Screen reader: folder button "Open our usual orders menu"; rows announce name, loved by, place, price; reorder announces new position ("Moved up, position 3 of 10", `aria-live`).
- [ ] Reduced motion: sheet fades only; no floating, no swing, no stagger.
- [ ] 8 new doodles look consistent at 24/48/96px in light and dark on `/dev/icons`.
- [ ] Existing "delete all" flows still work and do not touch the menu.

## 8. Commit title
`Home: "Our usual orders" counter and shared menu with book-open animation, plus 8 new food doodles`

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

# FEATURE SPEC (04 · "Our usual orders": a mini resto menu on Home)

## 1. Goal and user flow
Turn the static "Our usual orders" strip on Home (today the constant `USUAL_ORDERS` in `HomePage.jsx`, section `home-orders`) into a living, shared menu: a cute restaurant counter with a menu folder that opens with a book animation, foods appearing one by one, and full add / edit / delete / reorder that both of us share. Also adds 8 new food doodles to the Icon kit.

**Flow (phone first).**
1. Home -> scroll to the counter scene "Our usual orders" (awning, little sign, the menu folder on the counter).
2. Tap the folder -> it opens (cover swings open left, 0.7s) -> a menu sheet slides up with the foods popping in one by one.
3. Browse; filter chips "All / Hers / His / Both".
4. "Add to the menu" -> form (name, doodle, who loves it, place, price, note) -> Save -> the new food pops in at the bottom (or top) of the list.
5. Tap a food -> edit sheet; "Remove from the menu" asks a ConfirmDialog.
6. "Reorder" -> drag handles (or up/down buttons) -> new order saved for both.
7. Close the menu -> folder closes with a soft squash.

## 2. UX spec

### Home counter scene (`UsualOrdersCounter`)
- 390px: full-width card (`--surface`, 2px outline, `--radius-card-lg`, `--shadow-card`), height ~220px. Content: a striped awning (CSS: repeating `--citrus`/`--white` stripes with a scalloped bottom edge via `radial-gradient`), a hanging wooden-style sign on the left built as a Caveat label plate "open · all day" (text on a `--white` plate, never on stripes), a counter slab (`--amalfi-tint` with ink outline) and on it: the **menu folder** (a 96x120 CSS/SVG folder in `--amalfi` with a `--gelato` label reading "menu" in Caveat, tilted -4deg), plus up to 3 tiny food doodles (`Icon` size 36: the first 3 foods) sitting on the counter. A caption in Caveat: **"tap the menu, love"**. The sticker rule: this scene is NOT a sticker cluster; the foods are plain icons (no `sticker`).
- 1440px: the card sits in the two-column area under "Recent notes" or full width below the hero (keep the section position of `home-orders`), max-width 1100px, scene on the left 55%, a preview list of the first 4 foods (name + loved-by dots) on the right 45%, "Open the menu" `Button variant="primary"`.
- Idle micro-interaction: the folder gently floats (`y 0 <-> -4px`, 3.2s ease-in-out loop) and the awning swings 0.6deg; both stop on reduced motion. Hover (desktop): folder lifts `y:-6`, tilt 0.
- Tap: folder `scale 0.96` (80ms) then opens.
- States: loading = counter with a "…" sign and the folder greyed (`aria-busy`); error = sign "closed for a sec", folder disabled, `Button size="sm"` "Try again"; empty = sign "new menu", caption "add our first usual"; success = nothing special.

### Menu sheet (`MenuBook`)
- Container: `Modal` (`title="Our usual orders"`, `size="lg"`) that on phones fills the screen (CSS override in the module). The sheet is styled as a menu card: `--paper-warm` page, dashed `--line-soft` divider rules, header with a small `utensils` doodle, a Caveat sub-line **"what we always end up ordering"**.
- **Opening animation** (framer-motion, `AnimatePresence`): (a) a folder-cover element (same look as the counter folder) rotates `rotateY 0 -> -160deg` around its left edge (`transform-origin: left`, `perspective: 900px`) in 0.7s with spring `{stiffness: 120, damping: 16}` while the menu page scales `0.92 -> 1` and fades in (0.4s expo-out `[0.16,1,0.3,1]`), then the cover fades out. (b) Foods appear one by one: each row `initial {opacity:0, y:14, scale:.94, rotate:-1.5}` -> `animate {1,0,1,0}` with spring `{type:'spring', stiffness:380, damping:20}`, `delay = 0.35 + i*0.09` (cap the total stagger at 1.2s; items beyond the 12th appear together). Closing: reverse in 0.35s. Reduced motion: no rotation or stagger, the sheet simply fades in (150ms) and all foods are visible.
- Toolbar (sticky top, `--paper-warm`): filter `Chip`s "All · Hers · His · Both" (`radio`), `IconButton label="Reorder"` (lucide `ArrowUpDown`), and `Button size="sm" variant="primary"` **"Add to the menu"** (the one tomato button).
- Food row (min height 72px; one column on phones, two columns >= 900px): left a `sticker` doodle (size 52, tilt alternating -4/+4deg), centre name (Shantell 800, 1.05rem, wraps up to 2 lines) + line 2 in Caveat: `place` and `₱price` joined by " · " (omit missing parts), a note preview (1 line) under it; right: loved-by badge (`her` doodle 28px / `him` 28px / both overlapping), and a "more" `IconButton label="More options for <name>"` (lucide `MoreHorizontal`) opening a small menu (Edit, Move up, Move down, Remove). The whole row is also a button that opens Edit.
- Empty state: `utensils` doodle size 96, **"The menu is empty."** / Caveat **"what do we always order?"**, primary button "Add our first usual". Loading: 4 skeleton rows (pulse 1.4s). Error: inline card **"Couldn't open the menu."** + "Try again".
- **Reorder mode**: toggled by the Reorder button (button label becomes "Done"). Rows show a drag handle (lucide `GripVertical`, 44px tap target) and Up/Down `IconButton`s (these are the keyboard/screen-reader path). Drag uses framer-motion `Reorder.Group axis="y"` + `Reorder.Item` (already in framer-motion, no new dependency) with `whileDrag {scale:1.03, boxShadow: offset}` and spring `{300, 22}`. On drop (or after 600ms of no change when using buttons) one `PUT /menu-items/order` is sent. Optimistic update; on failure toast "Couldn't save the new order." and revert.
- Filters hide rows with CSS-less logic (client side). Reorder is disabled while a filter other than "All" is on (hint: "Switch to All to reorder").

### Add / Edit form (`MenuItemForm`, a nested `Modal size="md"`)
- Fields (all `Field` + shared controls): **Name** (required, 1-60 chars, placeholder "Mr. B bulalo"), **Doodle** (`RadioGroup variant="tile"`, grid of food doodles: `matcha cookie yogurt fries churro lasagna pizza donut bowl lechon utensils` + the 8 new ones, 56px tiles, 4 per row on phones; selected = ink ring; accessible names "Matcha", "Burger", ...), **Who loves it?** (`RadioGroup variant="tile"` three tiles: `her` "Hers", `him` "His", both "Both of us"; default Both), **Where?** (optional text, 80), **Price** (optional number input `inputmode="numeric"`, prefix "₱", 0-99,999), **Note** (optional textarea 200, Caveat placeholder "extra shot, no ice…").
- Buttons: `Button variant="primary"` "Save to the menu" (busy: "Saving…"), `Button variant="ghost"` "Cancel"; edit mode adds `Button variant="danger"` "Remove from the menu" (ConfirmDialog `danger`, title "Take it off the menu?", message "<name> will be gone for both of us.").
- Validation messages: "Give it a name, love." / "That price looks off." Inline under fields (`Field error`). Server 409: "<Partner name> just changed this one. Reload to see their version?" with a "Reload" button.
- Keyboard: Enter in name submits; Escape closes (confirm if dirty: "Discard changes?"); tile groups use arrow keys.

### Proposed new food doodles (add to `GLYPHS`, 64x64, same style)
Style rules for ALL: viewBox 0 0 64 64; the wrapper already sets `fill="none" stroke=currentColor(ink) stroke-width 2.6 round caps/joins`; every closed shape gets one flat fill from the palette (no gradients, no shadows); at most 6-8 shapes; one tiny highlight line or dot in `#FFFFFF`; keep shapes slightly wobbly/rounded (use `C` curves, avoid perfect circles except eyes); optional kawaii face is NOT used on foods (faces are reserved for characters). Colours: `#FFC76B` (bun/pastry), `#FFE680` (cheese/butter), `#FF9F1C` (orange accents), `#E0301A` (red details), `#5CB3FF` (cold/glass), `#CDE7FF` (ice/milk), `#5E9B4E` (greens), `#8A4B2A` (meat/chocolate), `#FFFFFF` highlights. Starter drawings (refine by eye at 24/48/96px):
- `burger`: top bun `M10 30 C10 15 54 15 54 30 Z` fill `#FFC76B`; 3 sesame ticks (short strokes at (24,22) (32,19) (40,23)); lettuce wave `M8 33 Q14 38 20 33 T32 33 T44 33 T56 33 V35 H8 Z` fill `#5E9B4E`; patty `rect x9 y36 w46 h7 rx3.5` fill `#8A4B2A`; cheese triangle `M14 43 L22 49 L30 43 Z` fill `#FFE680`; bottom bun `M10 45 H54 Q54 53 46 53 H18 Q10 53 10 45 Z` fill `#FFC76B`.
- `ramen`: bowl `M8 30 H56 C56 46 46 55 32 55 C18 55 8 46 8 30 Z` fill `#FFFFFF`; broth line ellipse inside top (`M10 30 C20 34 44 34 54 30`) fill `#FF9F1C`; 3 wavy noodle strokes rising `M20 30 Q24 22 28 30 M30 30 Q34 20 38 30 M40 30 Q44 23 48 30`; egg half circle `M36 26 a6 6 0 0 1 12 0` fill `#FFE680` with a `#FF9F1C` dot yolk; chopsticks two diagonal lines from (44,6) to (30,26) and (50,8) to (36,27).
- `milkTea`: cup tapered `M16 20 L20 56 H44 L48 20 Z` fill `#CDE7FF`; tea level `M18 32 L20 56 H44 L46 32 Z` fill `#C99A6B`; dome lid `M14 20 C14 10 50 10 50 20 Z` fill `#FFFFFF`; fat straw `M36 4 L40 22` stroke thick (width 4) in `#E0301A`; 4 boba circles r2.4 filled `#172B70` at the bottom.
- `iceCream`: cone `M20 30 L32 58 L44 30 Z` fill `#FFC76B` with a diamond lattice (2 crossing line pairs); scoop 1 `C` blob `M16 30 C14 14 50 14 48 30 Z` fill `#FF8FB1`; scoop 2 smaller on top fill `#FFFFFF`; cherry circle r3.5 `#E0301A` + stem line; drip bump on the lower edge.
- `cake`: plate ellipse base `#CDE7FF`; two-layer slice `M10 34 L54 34 L54 52 L10 52 Z` rounded; layers: sponge `#FFE680`, cream `#FFFFFF` wavy band, frosting top `M10 34 C14 26 20 30 24 26 C30 30 36 26 40 30 C46 26 50 30 54 34 Z` fill `#FF8FB1`; candle rect `#5CB3FF` with a flame teardrop `#FF9F1C`.
- `sushi`: nigiri: rice oval `M10 40 C10 30 54 30 54 40 C54 50 10 50 10 40 Z` fill `#FFFFFF` with 3 grain dots; salmon topping `M12 36 C20 24 44 24 52 36 C44 34 20 34 12 36 Z` fill `#FF9F1C` with 2 white stripes; nori band `rect x28 y28 w8 h22` fill `#2B3A55` (a dark navy-grey) with an ink outline.
- `coffee`: mug `M12 24 H44 V44 C44 52 38 56 28 56 C18 56 12 52 12 44 Z` fill `#FFFFFF`; handle `M44 28 C54 28 54 42 44 42` ; coffee surface ellipse `#8A4B2A`; heart latte art in `#FFE680` tiny; 2 steam curls above `M22 18 C18 12 26 10 22 4 M32 18 C28 12 36 10 32 4`; saucer line.
- `siomai`: steamer base ellipse `#C99A6B` with wooden slat lines; dumpling: wrapper `M16 38 C16 24 28 20 32 24 C36 20 48 24 48 38 Z` fill `#FFE680` with 5 little pleat lines on top and an orange dot (carrot) at the crown `#FF9F1C`; second smaller dumpling behind; bamboo lid hint on the left.
Add all eight to `STICKER_GROUPS` in `constants/loveBoardCatalog.js` under the "Us" group so they appear as Love Board stickers, add them to the album doodle list automatically (`PICKABLE_DOODLES = ICON_NAMES - her/him`), and preview them on `/dev/icons`.

### Seed content (first run)
Inserted by the Flyway migration, in this order, `sort_order` 1000, 2000, … : matcha (**her**, doodle `matcha`), cookies & cream (**him**, `cookie`), Yowell (both, `yogurt`), yogurt + fries (both, `fries`), churros (both, `churro`), lasagna (both, `lasagna`), Angel's spinach pizza (both, `pizza`, place "Angel's"), Alcapone & Boston creme donuts (both, `donut`), lechon pares (both, `lechon`), Mr. B bulalo (both, `bowl`). Only matcha and cookies & cream were specified as hers/his, everything else defaults to "both"; they can edit.

### Dark mode, copy tone
Menu page uses `--paper-warm`/`--surface`, awning stripes `--citrus`/`--surface`, doodles use `--icon-ink`. Warm copy only: "Nothing here yet, love." "Added to the menu." (success toast), "Took it off the menu." (info toast).

## 3. Files to change / add
Frontend:
- ADD `fsp_frontend/src/components/home/UsualOrdersCounter/UsualOrdersCounter.jsx` + `.module.css`: the counter scene and the folder.
- ADD `fsp_frontend/src/components/home/MenuBook/MenuBook.jsx` + `.module.css`: the opening menu sheet, rows, reorder.
- ADD `fsp_frontend/src/components/home/MenuBook/MenuItemForm.jsx`: add/edit form.
- ADD `fsp_frontend/src/services/menuService.js`: axios calls.
- CHANGE `fsp_frontend/src/queries/queryKeys.js` (`menuItems`), `queries/queries.js` (`useMenuItems`), `queries/mutations.js` (`useMenuMutations`: create/update/delete/reorder with optimistic cache updates).
- CHANGE `fsp_frontend/src/pages/HomePage.jsx` + `HomePage.module.css`: remove the `USUAL_ORDERS` constant and old strip; mount `UsualOrdersCounter`.
- CHANGE `fsp_frontend/src/components/Icon/glyphs.jsx`: 8 new glyphs.
- CHANGE `fsp_frontend/src/constants/loveBoardCatalog.js`: add new icons to the "Us" sticker group.
- CHANGE `fsp_frontend/src/dev/IconCheck.jsx`: only if it lists names manually.
- ADD `fsp_frontend/src/constants/menuOptions.js`: `FOOD_DOODLES` (ordered list), `LOVED_BY` options.
Backend:
- ADD `fsp_backend/src/main/resources/db/migration/V5__menu_items.sql` (table + seed).
- ADD `entity/MenuItem.java`, `repository/MenuItemRepository.java`, `dto/MenuItemDTO.java`, `dto/request/MenuItemRequest.java`, `dto/request/MenuReorderRequest.java`, `service/MenuService.java`, `controller/MenuController.java`.
- NOTE (no file change): notifications use the existing `NotificationType.SYSTEM` with no related entity, because the `notifications` table has CHECK constraints on `type` and `related_entity_type` (see `V1__baseline.sql`). Do NOT add enum values without a Flyway migration that alters those constraints.

## 4. Data
Flyway `V5__menu_items.sql`:
```sql
-- V5: "Our usual orders": the shared menu of foods we always get.
CREATE TABLE IF NOT EXISTS menu_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        varchar(60)  NOT NULL,
  doodle      varchar(24)  NOT NULL DEFAULT 'utensils',
  loved_by    varchar(4)   NOT NULL DEFAULT 'both' CHECK (loved_by IN ('her','him','both')),
  place       varchar(80),
  price_php   integer      CHECK (price_php IS NULL OR (price_php >= 0 AND price_php <= 99999)),
  note        varchar(200),
  sort_order  integer      NOT NULL,
  version     bigint       NOT NULL DEFAULT 0,
  created_by  bigint,
  created_at  timestamptz  NOT NULL DEFAULT now(),
  updated_at  timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_menu_items_sort ON menu_items (sort_order);

INSERT INTO menu_items (name, doodle, loved_by, place, sort_order)
SELECT v.name, v.doodle, v.loved_by, v.place, v.sort_order FROM (VALUES
  ('matcha',                          'matcha',  'her',  NULL,       1000),
  ('cookies & cream',                 'cookie',  'him',  NULL,       2000),
  ('Yowell',                          'yogurt',  'both', NULL,       3000),
  ('yogurt + fries',                  'fries',   'both', NULL,       4000),
  ('churros',                         'churro',  'both', NULL,       5000),
  ('lasagna',                         'lasagna', 'both', NULL,       6000),
  ('Angel''s spinach pizza',          'pizza',   'both', 'Angel''s', 7000),
  ('Alcapone & Boston creme donuts',  'donut',   'both', NULL,       8000),
  ('lechon pares',                    'lechon',  'both', NULL,       9000),
  ('Mr. B bulalo',                    'bowl',    'both', NULL,      10000)
) AS v(name, doodle, loved_by, place, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM menu_items);
```
Entity `MenuItem` (`@Version Long version`, `@Column(name="price_php") Integer pricePhp`, etc., `OffsetDateTime` timestamps like other entities). DTO `MenuItemDTO { id, name, doodle, lovedBy, place, pricePhp, note, sortOrder, version, createdAt, updatedAt }`.
`doodle` is validated server-side against an allow-list constant (the icon names) to avoid junk; unknown -> `utensils`.
**Storage**: about 200 bytes per item (name 30 + place 20 + note 40 + overhead). **~0.2 KB per item; ~200 KB per 1,000 items.** (Realistic size: under 100 items.)
Reorder uses spaced integers (steps of 1000, midpoint insert; renumber all only when the gap closes), so a drag writes 1 row, not N.

## 5. API
All `@PreAuthorize("isAuthenticated()")`, base `/api/v1/menu-items`.
- `GET /api/v1/menu-items` -> `200 [ {"id":"…","name":"matcha","doodle":"matcha","lovedBy":"her","place":null,"pricePhp":null,"note":null,"sortOrder":1000,"version":0,"createdAt":"…","updatedAt":"…"} ]` sorted by `sortOrder`.
- `POST /api/v1/menu-items` body `{ "name":"Ramen night", "doodle":"ramen", "lovedBy":"both", "place":"Ramen Nagi", "pricePhp":420, "note":"extra egg", "afterId":"<uuid>|null" }` -> `201` item (`afterId` null = last). Errors: `400 {"success":false,"message":"Give it a name."}`.
- `PUT /api/v1/menu-items/{id}` body same fields + `"version":3` -> `200` item with `version` incremented; `404`; `409 {"success":false,"message":"This was just changed by someone else."}` when versions differ.
- `DELETE /api/v1/menu-items/{id}` -> `204`; `404`.
- `PUT /api/v1/menu-items/order` body `{ "ids": ["uuid1","uuid2", …] }` (full order) -> `200` the reordered list; `400` if ids do not match the existing set (client must refetch).
Notifications: create/delete call `notifyOthers` (type `SYSTEM`, no related entity) ("Chicken added ramen to our usual orders"); updates and reorder do not notify.
Activity log: reuse `activityLogService.log(...)` with action names `MENU_ITEM_CREATED/UPDATED/DELETED` and no new `RelatedEntityType` value (check any `activity_logs` constraints in `V1__baseline.sql` before adding one).

## 6. Edge cases and risks
- **Two people editing at once**: optimistic `version` -> 409 -> friendly reload prompt; reorder by both at the same time: last full-order write wins; the other sees it on refetch (add `refetchOnWindowFocus` default behaviour, `staleTime 30s`).
- **Deleting an item someone else is editing**: edit save returns 404 -> "That one was taken off the menu." and close the form.
- **Old data**: first deploy seeds only if the table is empty (`WHERE NOT EXISTS`). If the Flyway baseline-on-migrate behaviour re-runs on an old DB it is idempotent.
- **Reorder while filtered**: disabled to avoid reordering a subset incorrectly.
- **Price**: whole pesos only; display with `toLocaleString('en-PH')`.
- **Doodle not in the Icon kit** (renamed later): `Icon` returns null; fall back to `utensils` when `GLYPHS[name]` is missing.
- **Delete all**: the menu is curated shared data and is NOT wiped by the existing three "delete all" actions; state this in the Profile/Admin copy if relevant. (Admin "delete all" dialogs list what they delete; menu is not in the list.)
- **No Drive involvement**; no images stored.
- **Animation cost**: ~10-40 rows with springs is fine; cap stagger; `will-change: transform` only during the opening.
- **Accessibility of drag**: always provide the Up/Down buttons.

## 7. Acceptance checklist
- [ ] 390px: counter scene fits, no horizontal scroll; folder is a 44px+ tap target; menu opens full-screen; rows readable; "Add to the menu" reachable with one thumb.
- [ ] Opening animation: folder swings, foods pop one by one; closing is quick.
- [ ] Add, edit, delete, reorder (drag and buttons) all persist and show up for the partner after refetch; partner gets one notification for add/delete.
- [ ] Seeded 10 foods appear exactly once, matcha hers, cookies & cream his.
- [ ] Dark mode: counter, awning, menu page, tiles all readable; doodles outlined with `--icon-ink`.
- [ ] Keyboard: open folder (Enter/Space), tab through rows, Enter edits, Escape closes, reorder with Up/Down buttons, focus returns to the folder.
- [ ] Screen reader: folder button "Open our usual orders menu"; rows announce name, loved by, place, price; reorder announces new position ("Moved up, position 3 of 10", `aria-live`).
- [ ] Reduced motion: sheet fades only; no floating, no swing, no stagger.
- [ ] 8 new doodles look consistent at 24/48/96px in light and dark on `/dev/icons`.
- [ ] Existing "delete all" flows still work and do not touch the menu.

# FILES I WILL PASTE BELOW
Frontend (shared, to reuse):
- fsp_frontend/src/components/ui/Modal/Modal.jsx and Modal.module.css
- fsp_frontend/src/components/ui/ConfirmDialog/ConfirmDialog.jsx
- fsp_frontend/src/components/ui/Button/Button.jsx and Button.module.css
- fsp_frontend/src/components/ui/IconButton/IconButton.jsx and IconButton.module.css
- fsp_frontend/src/components/ui/Field/Field.jsx and fsp_frontend/src/components/ui/FormControls.module.css
- fsp_frontend/src/components/ui/RadioGroup/RadioGroup.jsx and RadioGroup.module.css
- fsp_frontend/src/components/ui/Chip/Chip.jsx and Chip.module.css
- fsp_frontend/src/components/Icon/Icon.jsx and glyphs.jsx (paste whole files; add 8 glyphs without touching existing ones)
- fsp_frontend/src/constants/animations.js
- fsp_frontend/src/constants/loveBoardCatalog.js
- fsp_frontend/src/hooks/useNotification.js
- fsp_frontend/src/styles/design-tokens.css
Frontend (related, to change):
- fsp_frontend/src/pages/HomePage.jsx and HomePage.module.css
- fsp_frontend/src/queries/queryKeys.js
- fsp_frontend/src/queries/queries.js
- fsp_frontend/src/queries/mutations.js
- fsp_frontend/src/services/homeService.js (service style reference)
- fsp_frontend/src/dev/IconCheck.jsx
Backend (reference + to change):
- fsp_backend/src/main/resources/db/migration/V3__drive_file_ids.sql (style reference)
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/controller/MemoryController.java (controller style reference)
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/entity/MemoryFolder.java (entity style reference)
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/service/NotificationService.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/entity/NotificationType.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/entity/RelatedEntityType.java
- fsp_backend/src/main/java/com/forsneakypea/fspbackend/service/ActivityLogService.java

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
