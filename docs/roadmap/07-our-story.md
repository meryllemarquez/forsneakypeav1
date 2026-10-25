# 07 · Our story: an illustrated storybook

## 1. Goal and user flow
Show "our story" as a small illustrated book. Logged out, the landing page shows a short teaser (pages 1 and 7) with a "Read our story" button that leads through login to the book. On Home, the full book: cover + 7 pages, page-turn animation, swipe and keys, page dots, a hand-built illustrated scene on every page (icon kit + CSS/SVG, no photos) with ambient motion. No backend, no database.

**Flow (logged out).** `/auth` landing -> scroll to the storybook teaser (a closed-ish book with the first and last pages peeking) -> "Read our story" -> the login card opens/scrolls into view with the note "Sign in to read it" -> after login the user lands on `/home#our-story` -> the Home "Our story" card scrolls into view and the book opens automatically (once) -> read page by page.
**Flow (logged in).** Home -> "Our story" book-cover card -> tap -> the book opens full screen -> swipe or tap arrows -> last page -> "Close" -> back on Home.

## 2. UX spec

### The text (use EXACTLY; do not rewrite, add or remove any word)
Book title (cover): **A beautiful and chaotic love story that began in 2023.**
Signed (printed in the closing lines of page 7): **With love, Chicken and Junebug**
Each page below has a heading, then the body. The body is ONE paragraph per page (line breaks in the source file are only wrapping; join them with a single space). Keep the punctuation exactly, including the em dashes (—) with no spaces around them.

**Page 1: The beginning**
Every love story has a beginning, and ours started when two people, Cj Tacorda and Merylle Marquez, crossed paths in 2023.
Visual: two little figures (the `her` and `him` doodles) far apart on a soft hill, a big "2023" written in the sky like a star constellation.

**Page 2: An unexpected place**
We did not cross paths normally, it was through a platform that nobody would expect to be the one to influence a great story.
Visual: two phones with chat bubbles flying between them; a paper plane (the `plane` icon) carrying a tiny heart across the page.

**Page 3: Something more**
What began as a simple conversation slowly turned into something more meaningful—a connection filled with laughter, unforgettable memories, both happy and sad, little moments both dark and bright, and a love that continues to grow.
Visual: chat bubbles turning into floating memories (camera, film, mic, matcha, cookie). Half the page sunny, half a starry night, meeting in the middle.

**Page 4: The little things**
Since then, we've shared experiences that have brought us closer, learned more about each other, and discovered that love isn't just about the big moments. It's also about the little things: the random conversations, the silly things, the comfort of being together, and choosing each other even on our bad to worst days.
Visual: Motmot parked by NLEX at night, the two of them sitting together, food icons around (fries, yogurt, churros), a small rain cloud with a heart umbrella.

**Page 5: A real one**
Our journey isn't about having a perfect love story. It's about building a real one—filled with understanding, patience, trust, growth, and the willingness to face whatever life brings our way, hand in hand.
Visual: the little house being built brick by brick, each brick labelled with one word: understanding, patience, trust, growth.

**Page 6: One memory at a time**
From the day we met in 2023 to every moment we continue to create, we're writing our own story, one memory at a time. And if there's one thing we're sure of, it's not the end of the line.
Visual: a road that keeps going over the hills, Motmot riding toward the horizon, the dogs and plushies running along, the road never ending.

**Page 7: To be continued**
Two hearts, one story, and countless memories to be written and shared.
(then, on its own lines, in handwriting) With love,
Chicken and Junebug
Visual: two hearts joined into one, a blank next page with "to be continued..." and a pen.

The text lives in one constants file (`constants/ourStory.js`) exported as `[{ id, number, title, body, signature? }]`; `docs/our-story.md` stays the source of truth and a small node script checks they match (see files).

### Book anatomy
- **Cover** (index 0): navy cloth cover (`--amalfi` fill, 2px outline, spine stitching drawn with CSS dashed lines, a `--gelato` label plate) with the title in Shantell on the plate (text only on the plate), a tiny `her` + `him` pair as stickers at the bottom (the only sticker cluster here), a ribbon bookmark in `--citrus` hanging out. Hint in Caveat: "tap to open".
- **Pages** 1-7. Each page = **scene area** (illustration) + **text plate** (`--paper-warm`, 2px outline, radius 24, text in Nunito 1.05-1.2rem, line-height 1.6, heading Shantell 800, "Page 3" label in Caveat above the heading). Body text never overlays the scene.
- **390px layout (one page at a time)**: full-height card inside a near-fullscreen `Modal` (safe-area aware): top row: close `IconButton label="Close the book"`, "Page 3 of 7" (live region), (right) sound/motion not needed; scene area ~48% of the height; text plate ~40% (scrollable if it overflows; with a bottom fade when more text is hidden; page 4 is the longest, make sure 360x640 works with `clamp(1rem, 4.2vw, 1.15rem)`); bottom row: Prev `IconButton`, 7 dots, Next `IconButton`.
- **1440px layout (two-page spread)**: book 1100x680 centered on a dimmed backdrop; left page = scene, right page = text plate with page number in the corner; spine shadow in the middle; Prev/Next arrows outside the book, dots under it. The cover shows as a single closed book (centered, 520px wide) that opens with a 3D swing.
- **Open animation**: cover rotates `rotateY 0 -> -170deg` around its left edge (`perspective: 1800px`, 0.9s spring `{stiffness: 90, damping: 16}`) revealing page 1; on phones the cover just lifts and fades (scale 1 -> 1.08, 0.4s) because 3D is cramped.

### Page turn
- **Desktop**: page-curl effect with CSS 3D: the right page flips around the spine (`transform-origin: left center`, `rotateY 0 -> -180deg`, 0.8s `cubic-bezier(0.65, 0, 0.35, 1)`), with a moving shadow gradient (opacity peaks at 90deg) and a slight lift (`translateZ`), the back face already shows the next illustration. Turning back mirrors it.
- **Phones**: slide with spring `{stiffness: 300, damping: 32}`: outgoing page `x: -100%`, `rotateY: 12deg`, `scale: .94`; incoming from the right. Follows the finger while dragging (`drag="x"`, `dragConstraints {left:0,right:0}`, `dragElastic .2`; commit when the drag is > 70px or velocity > 450px/s; otherwise springs back).
- **Reduced motion**: crossfade (opacity 150ms), no 3D, no drag-follow (swipe still changes page), no ambient motion.
- Input: swipe left/right; tap the right/left 25% edge zones on phones (not over text); `ArrowRight`/`ArrowLeft`, `PageDown`/`PageUp`, `Home`/`End`, `Esc` closes; click arrows/dots. Dots: 8 (cover + 7); 44px hit area with a visual 10px dot; the current is an elongated pill in `--citrus`; accessible: `<button aria-label="Go to page 3: Something more" aria-current="page">`.
- Focus: opening focuses the page heading (`tabindex="-1"`); each page change moves focus there and announces "Page 3 of 7: Something more" via `aria-live="polite"`. The text is real DOM text (selectable, readable by screen readers). Scenes are `role="img"` with a short `aria-label` (below) and `aria-hidden` children.
- Preload: only the current and next scene are mounted; scenes not on screen do not animate (saves battery and CPU).

### Scenes (build from the icon kit + CSS/SVG; coordinates are percentages of the scene box; loop timings are for ambient motion; all stop under reduced motion and when `document.hidden`)
Scene box aspect: 4:3 (desktop), 1:1 to 4:3 on phones. Palette tokens only (+ the night colours `#0E1533 #1B2A66 #3A3F85` for sky).
1. **The beginning** (`aria-label="Two figures far apart on a hill under a 2023 constellation"`): sky gradient `--sea-tint -> --paper`; rolling hill (large ellipse, `--amalfi-tint` with outline); `her` doodle (size 84) at left 10%, `him` (size 84) at right 12%, standing on the hill, far apart; "2023" as a constellation: 4 digits drawn with small stars (`--gelato`, ink outline) connected by dotted `--ink` lines; on entry the lines draw in over 2.2s (`stroke-dashoffset`), stars pop in sequence (spring `{380, 16}`, 80ms apart), then twinkle (opacity .6 <-> 1, 2-4s, staggered). Ambient: clouds drift (30s), the two figures bob alternately (3s ease-in-out, 4px).
2. **An unexpected place** (`"Two phones exchanging messages while a paper plane carries a tiny heart"`): two phone frames (CSS rounded rects with ink outline, screen `--white`) at left 8% and right 8%, tilted -6deg/+6deg; chat bubbles (`--sea-tint` and `--gelato-tint`, with 3 dot "typing" animation) appear alternately on each phone (pop spring, every 1.2s); the `plane` icon (size 72) flies along a dashed curved path between phones (CSS `offset-path` or framer `animate` along a quadratic Bezier) over 6s, looping, carrying a small tomato heart (hearts are allowed, it is a love moment) attached by a string; the dashed trail fades. Ambient: bubbles float up slowly.
3. **Something more** (`"Chat bubbles turning into floating memories, sunny on one side and starry on the other"`): background split on a soft diagonal: left half warm sunrise gradient `--sun-pale -> --sun-peach` with the `sun` icon, right half night `#0E1533 -> #1B2A66` with 14 twinkling stars and a crescent; the seam is a blurred 12% gradient so they "meet in the middle". Chat bubble shapes in the middle slowly morph (scale/opacity) into the memory icons `camera`, `film`, `mic`, `matcha`, `cookie` that float upward in a gentle S-curve (each 7-10s loop, staggered, rotate +-8deg). Icons stay readable on both halves (they have ink outlines; in the night half use `--icon-ink` light outline in dark theme).
4. **The little things** (`"Motmot parked by the highway at night with the two of them sitting together, food around and a rain cloud with a heart umbrella"`): night sky `#0E1533 -> #1B2A66` with stars; ground road band (dark `#1A2650` with dashed lane line animating slowly 1.5s); highway lamp posts (SVG) with warm `--glow` halos (flicker .9 <-> 1, 4s); green road sign plate `#5E9B4E` with white "NLEX" text (text on a plain plate); `motmot` icon (size 150) parked centre-left; `her` and `him` (size 56) sitting side by side on the roof/near the car (a tiny 2deg lean toward each other, breathing 4s); `fries`, `yogurt`, `churro` icons (size 44) orbiting gently in a loose ellipse (16-22s) around them; a small rain cloud (CSS blobs, `--sea-tint` fill) top-right with 8 raindrop streaks falling (1.1s linear loops) and a heart umbrella (SVG umbrella canopy with a tomato heart in the centre) held over the pair; the rain only falls on one side so the pair stays dry.
5. **A real one** (`"A little house being built brick by brick; the bricks read understanding, patience, trust and growth"`): a house frame made of 4 rows of bricks; each brick is a rounded rect (ink outline, `--citrus-tint`/`--sea-tint`/`--gelato-tint`/`--amalfi-tint`, text in Shantell 800 on the solid brick): bottom row **understanding** (wide), second **patience**, third **trust**, top **growth**; then a roof triangle (`--citrus` with outline) and door appear. Entry: bricks drop in from above one by one (spring `{300, 14}` with a tiny squash on landing: scaleY .85 -> 1, 450ms apart), roof last, then the `house` icon pops as the final thing and chimney smoke (3 circles rising and fading, 4s loop) starts. If a word is too wide on phones, font-size shrinks (clamp) and the brick wraps; the scene scales by `viewBox`.
6. **One memory at a time** (`"A road that goes on over the hills with Motmot riding toward the horizon and the dogs and plushies running along"`): three parallax hill layers (`--amalfi-tint`, `--sea-tint`, `--paper`) drifting at 40s/28s/18s loops; a road that curves to the horizon (perspective trapezoid) with lane dashes streaming toward the viewer (1.2s linear loop) so it feels endless; `motmot` (size 110) rides up the road, scaling from 1.0 to 0.35 over 8s as it nears the horizon, then re-emerges at the start (cross-fade); beside/behind it `dog`, `plush`, `ball`, `chimken`, `rorry` (size 48) trot in a line with offset bobbing (0.6s hop, 120ms apart); low `sun` on the horizon with soft rays rotating 60s. The text "not the end of the line" is NOT overlaid on the scene; it is in the text plate.
7. **To be continued** (`"Two hearts joined into one, and a blank page with a pen"`): left: two tomato hearts (SVG, ink outline) start apart, drift together and overlap into one joined heart (path morph or two overlapping shapes + a combined outline), 2.4s; then the joined heart beats (scale 1 -> 1.08 -> 1, 1.2s ease-in-out loop) with 5 tiny hearts/sparkles rising. Right page (desktop spread) / a peeking page corner under the text on phones: blank paper with faint lines, the text **"to be continued..."** in Caveat being written (clip-path reveal left-to-right 2.2s) and a `pen` doodle (new icon, see below) moving along as if writing, then resting with a small bob. On the last page the Next arrow is disabled; no extra words are added, the Close button pulses once gently instead.

### New icon needed
- `pen`: add to `GLYPHS` (64x64, same rules as other doodles): slanted fountain pen, body `M14 50 L44 20 L52 28 L22 58 Z` fill `--amalfi` `#1F55C9`, band `--gelato` stripe, nib `M14 50 L10 60 L22 58 Z` fill `#FFFFFF` with ink line, small ink dot at the tip, one white highlight line on the body. (If an `Icon` named `pen` already exists in the kit, reuse it.)

### Entry cards
- **Home "Our story" card**: a book-cover card (the same cover art at 110x150), Shantell title **"Our story"** (the heading of the source document), Caveat sub-line **"tap to read"**, `Button variant="primary"` "Read our story". The full title line appears only on the book cover. Placement: after "Recent memories" or beside the hero on desktop; id `our-story` for the anchor. States: loading n/a; nothing can fail (static), except lazy chunk load error -> toast "Couldn't open the book. Try again?".
- **Landing teaser** (`AuthPage.jsx`, below the sign-in card on phones, to the side of the hero on desktop): a closed-ish book showing page 1 (text + mini scene: hills and two small figures) on the left and page 7 (text + joined hearts) on the right, with a dotted "…" ribbon between them and Caveat caption **"a whole story in between"**; `Button variant="primary"` **"Read our story"**: it sets `?next=/home%23our-story`, opens/scrolls to the login card, and shows the helper text "Sign in to read it, love." After login, the existing redirect logic goes to `/home#our-story`. Pages 2-6 are not rendered or shipped to the logged-out bundle (lazy-load `OurStoryBook` only inside `/home`; the teaser uses its own tiny scene components).
- Dark theme (commit 03): book cover stays navy but lighter outline; pages use `--paper-warm`/`--surface`; scenes 3, 4, 6 already night/dark-friendly; scenes 1, 2, 5, 7 get dark sky variants via CSS variables on the scene root.

## 3. Files to change / add
Frontend:
- ADD `fsp_frontend/src/constants/ourStory.js`: verbatim story data (title, signed line, 7 pages).
- ADD `fsp_frontend/src/components/story/OurStoryBook/OurStoryBook.jsx` + `.module.css`: modal book, cover, spread/single layout, navigation, dots, a11y, focus.
- ADD `fsp_frontend/src/components/story/OurStoryBook/PageTurn.jsx`: desktop 3D curl / phone slide logic.
- ADD `fsp_frontend/src/components/story/scenes/Scene1Beginning.jsx` ... `Scene7Continued.jsx` + `scenes.module.css`, plus `SceneFrame.jsx` (shared box, aria-label, pause-when-hidden).
- ADD `fsp_frontend/src/components/story/StoryTeaser/StoryTeaser.jsx` + `.module.css`: landing teaser (pages 1 and 7 only).
- ADD `fsp_frontend/src/components/story/StoryCoverCard/StoryCoverCard.jsx`: Home card.
- ADD `fsp_frontend/src/hooks/usePageVisible.js` (document.hidden) and `useCoarsePointer` helper (or reuse `useMediaQuery`).
- ADD `scripts/check-our-story.mjs`: reads `docs/our-story.md`, normalises whitespace, compares to `constants/ourStory.js` bodies, exits non-zero on mismatch (run manually / in CI; no dependency).
- CHANGE `fsp_frontend/src/pages/HomePage.jsx` + `.module.css`: card + hash handling (`#our-story` scrolls and opens once).
- CHANGE `fsp_frontend/src/pages/AuthPage.jsx` + `.module.css`: teaser, `next` handling, helper text.
- CHANGE `fsp_frontend/src/context/AuthProvider.jsx` / `AuthPage` login redirect: honour a safe `next` (only same-origin paths starting with `/home`).
- CHANGE `fsp_frontend/src/components/Icon/glyphs.jsx`: add `pen` if missing.
Backend: none.

## 4. Data
None. No Flyway migration, no JPA, no DTOs. Static content (about 2 KB of text plus scene code, lazy-loaded). Per-device state only: `localStorage['fsp-story-seen']` (open the book automatically only the first time after a teaser login) and optionally `fsp-story-page`. Storage in the database: 0 bytes per item / 0 per 1,000.

## 5. API
None. (Optional later: a `GET /api/v1/story` if the text should become editable; out of scope.)

## 6. Edge cases and risks
- **Text drift**: the constants file is a copy of `docs/our-story.md`; `scripts/check-our-story.mjs` guards it. Do NOT "fix" grammar ("We did not cross paths normally, it was through…" stays as written).
- **Long text on small screens** (360x640): body scrolls inside the plate, fade hint; never clip silently.
- **3D transforms on low-end phones/Safari**: use 2D slide on phones; on desktop add `backface-visibility: hidden` and `will-change: transform` only during the turn; test Safari.
- **Battery**: only the active scene runs animations; pause on `document.hidden`; reduced motion static.
- **Logged-out bundle size**: the teaser must not import the full book or all scenes.
- **Open redirect**: `next` accepts only `/home...` paths; ignore anything else.
- **Two users**: no shared state; nothing to conflict.
- **Deleting / delete-all**: not applicable (static). Verify the "delete all" dialogs do not mention the story.
- **Old data / users with the book half-read**: no persistence beyond localStorage; clearing storage only resets the auto-open.
- **Accessibility**: heavy motion scenes are decorative; the text must be fully readable without them; `aria-live` announcements throttled to page changes.
- **Taglish/typography**: keep the apostrophes exactly (`we've`, `isn't`, `It's`, `there's`, `we're`, `it's`); use straight or curly consistently with the source (source uses straight `'`).

## 7. Acceptance checklist
- [ ] `node scripts/check-our-story.mjs` passes (text identical to `docs/our-story.md`).
- [ ] 390px: cover opens, every page readable without horizontal scroll, text plate scrolls when needed, swipe turns pages, dots/arrows >= 44px.
- [ ] 1440px: two-page spread, curl turn animation, arrow keys work, Esc closes.
- [ ] Landing teaser shows pages 1 and 7 only; "Read our story" -> login -> `/home#our-story` -> book opens.
- [ ] Each of the 7 scenes matches its visual note; ambient motion pauses off-screen.
- [ ] Dark mode: all pages readable; night scenes look intentional; cover contrast ok.
- [ ] Keyboard-only: open from Home card, turn pages, jump with Home/End, close, focus returns to the card.
- [ ] Screen reader: announces "Page N of 7: <title>"; scenes have short labels; body text is plain text.
- [ ] Reduced motion: crossfade only, no ambient animation.
- [ ] Works alongside the existing "delete all" features (no interaction).

## 8. Commit title
`Our story: illustrated storybook with page-turn animation on Home and a teaser on the landing page`

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

# FEATURE SPEC (07 · Our story: an illustrated storybook)

## 1. Goal and user flow
Show "our story" as a small illustrated book. Logged out, the landing page shows a short teaser (pages 1 and 7) with a "Read our story" button that leads through login to the book. On Home, the full book: cover + 7 pages, page-turn animation, swipe and keys, page dots, a hand-built illustrated scene on every page (icon kit + CSS/SVG, no photos) with ambient motion. No backend, no database.

**Flow (logged out).** `/auth` landing -> scroll to the storybook teaser (a closed-ish book with the first and last pages peeking) -> "Read our story" -> the login card opens/scrolls into view with the note "Sign in to read it" -> after login the user lands on `/home#our-story` -> the Home "Our story" card scrolls into view and the book opens automatically (once) -> read page by page.
**Flow (logged in).** Home -> "Our story" book-cover card -> tap -> the book opens full screen -> swipe or tap arrows -> last page -> "Close" -> back on Home.

## 2. UX spec

### The text (use EXACTLY; do not rewrite, add or remove any word)
Book title (cover): **A beautiful and chaotic love story that began in 2023.**
Signed (printed in the closing lines of page 7): **With love, Chicken and Junebug**
Each page below has a heading, then the body. The body is ONE paragraph per page (line breaks in the source file are only wrapping; join them with a single space). Keep the punctuation exactly, including the em dashes (—) with no spaces around them.

**Page 1: The beginning**
Every love story has a beginning, and ours started when two people, Cj Tacorda and Merylle Marquez, crossed paths in 2023.
Visual: two little figures (the `her` and `him` doodles) far apart on a soft hill, a big "2023" written in the sky like a star constellation.

**Page 2: An unexpected place**
We did not cross paths normally, it was through a platform that nobody would expect to be the one to influence a great story.
Visual: two phones with chat bubbles flying between them; a paper plane (the `plane` icon) carrying a tiny heart across the page.

**Page 3: Something more**
What began as a simple conversation slowly turned into something more meaningful—a connection filled with laughter, unforgettable memories, both happy and sad, little moments both dark and bright, and a love that continues to grow.
Visual: chat bubbles turning into floating memories (camera, film, mic, matcha, cookie). Half the page sunny, half a starry night, meeting in the middle.

**Page 4: The little things**
Since then, we've shared experiences that have brought us closer, learned more about each other, and discovered that love isn't just about the big moments. It's also about the little things: the random conversations, the silly things, the comfort of being together, and choosing each other even on our bad to worst days.
Visual: Motmot parked by NLEX at night, the two of them sitting together, food icons around (fries, yogurt, churros), a small rain cloud with a heart umbrella.

**Page 5: A real one**
Our journey isn't about having a perfect love story. It's about building a real one—filled with understanding, patience, trust, growth, and the willingness to face whatever life brings our way, hand in hand.
Visual: the little house being built brick by brick, each brick labelled with one word: understanding, patience, trust, growth.

**Page 6: One memory at a time**
From the day we met in 2023 to every moment we continue to create, we're writing our own story, one memory at a time. And if there's one thing we're sure of, it's not the end of the line.
Visual: a road that keeps going over the hills, Motmot riding toward the horizon, the dogs and plushies running along, the road never ending.

**Page 7: To be continued**
Two hearts, one story, and countless memories to be written and shared.
(then, on its own lines, in handwriting) With love,
Chicken and Junebug
Visual: two hearts joined into one, a blank next page with "to be continued..." and a pen.

The text lives in one constants file (`constants/ourStory.js`) exported as `[{ id, number, title, body, signature? }]`; `docs/our-story.md` stays the source of truth and a small node script checks they match (see files).

### Book anatomy
- **Cover** (index 0): navy cloth cover (`--amalfi` fill, 2px outline, spine stitching drawn with CSS dashed lines, a `--gelato` label plate) with the title in Shantell on the plate (text only on the plate), a tiny `her` + `him` pair as stickers at the bottom (the only sticker cluster here), a ribbon bookmark in `--citrus` hanging out. Hint in Caveat: "tap to open".
- **Pages** 1-7. Each page = **scene area** (illustration) + **text plate** (`--paper-warm`, 2px outline, radius 24, text in Nunito 1.05-1.2rem, line-height 1.6, heading Shantell 800, "Page 3" label in Caveat above the heading). Body text never overlays the scene.
- **390px layout (one page at a time)**: full-height card inside a near-fullscreen `Modal` (safe-area aware): top row: close `IconButton label="Close the book"`, "Page 3 of 7" (live region), (right) sound/motion not needed; scene area ~48% of the height; text plate ~40% (scrollable if it overflows; with a bottom fade when more text is hidden; page 4 is the longest, make sure 360x640 works with `clamp(1rem, 4.2vw, 1.15rem)`); bottom row: Prev `IconButton`, 7 dots, Next `IconButton`.
- **1440px layout (two-page spread)**: book 1100x680 centered on a dimmed backdrop; left page = scene, right page = text plate with page number in the corner; spine shadow in the middle; Prev/Next arrows outside the book, dots under it. The cover shows as a single closed book (centered, 520px wide) that opens with a 3D swing.
- **Open animation**: cover rotates `rotateY 0 -> -170deg` around its left edge (`perspective: 1800px`, 0.9s spring `{stiffness: 90, damping: 16}`) revealing page 1; on phones the cover just lifts and fades (scale 1 -> 1.08, 0.4s) because 3D is cramped.

### Page turn
- **Desktop**: page-curl effect with CSS 3D: the right page flips around the spine (`transform-origin: left center`, `rotateY 0 -> -180deg`, 0.8s `cubic-bezier(0.65, 0, 0.35, 1)`), with a moving shadow gradient (opacity peaks at 90deg) and a slight lift (`translateZ`), the back face already shows the next illustration. Turning back mirrors it.
- **Phones**: slide with spring `{stiffness: 300, damping: 32}`: outgoing page `x: -100%`, `rotateY: 12deg`, `scale: .94`; incoming from the right. Follows the finger while dragging (`drag="x"`, `dragConstraints {left:0,right:0}`, `dragElastic .2`; commit when the drag is > 70px or velocity > 450px/s; otherwise springs back).
- **Reduced motion**: crossfade (opacity 150ms), no 3D, no drag-follow (swipe still changes page), no ambient motion.
- Input: swipe left/right; tap the right/left 25% edge zones on phones (not over text); `ArrowRight`/`ArrowLeft`, `PageDown`/`PageUp`, `Home`/`End`, `Esc` closes; click arrows/dots. Dots: 8 (cover + 7); 44px hit area with a visual 10px dot; the current is an elongated pill in `--citrus`; accessible: `<button aria-label="Go to page 3: Something more" aria-current="page">`.
- Focus: opening focuses the page heading (`tabindex="-1"`); each page change moves focus there and announces "Page 3 of 7: Something more" via `aria-live="polite"`. The text is real DOM text (selectable, readable by screen readers). Scenes are `role="img"` with a short `aria-label` (below) and `aria-hidden` children.
- Preload: only the current and next scene are mounted; scenes not on screen do not animate (saves battery and CPU).

### Scenes (build from the icon kit + CSS/SVG; coordinates are percentages of the scene box; loop timings are for ambient motion; all stop under reduced motion and when `document.hidden`)
Scene box aspect: 4:3 (desktop), 1:1 to 4:3 on phones. Palette tokens only (+ the night colours `#0E1533 #1B2A66 #3A3F85` for sky).
1. **The beginning** (`aria-label="Two figures far apart on a hill under a 2023 constellation"`): sky gradient `--sea-tint -> --paper`; rolling hill (large ellipse, `--amalfi-tint` with outline); `her` doodle (size 84) at left 10%, `him` (size 84) at right 12%, standing on the hill, far apart; "2023" as a constellation: 4 digits drawn with small stars (`--gelato`, ink outline) connected by dotted `--ink` lines; on entry the lines draw in over 2.2s (`stroke-dashoffset`), stars pop in sequence (spring `{380, 16}`, 80ms apart), then twinkle (opacity .6 <-> 1, 2-4s, staggered). Ambient: clouds drift (30s), the two figures bob alternately (3s ease-in-out, 4px).
2. **An unexpected place** (`"Two phones exchanging messages while a paper plane carries a tiny heart"`): two phone frames (CSS rounded rects with ink outline, screen `--white`) at left 8% and right 8%, tilted -6deg/+6deg; chat bubbles (`--sea-tint` and `--gelato-tint`, with 3 dot "typing" animation) appear alternately on each phone (pop spring, every 1.2s); the `plane` icon (size 72) flies along a dashed curved path between phones (CSS `offset-path` or framer `animate` along a quadratic Bezier) over 6s, looping, carrying a small tomato heart (hearts are allowed, it is a love moment) attached by a string; the dashed trail fades. Ambient: bubbles float up slowly.
3. **Something more** (`"Chat bubbles turning into floating memories, sunny on one side and starry on the other"`): background split on a soft diagonal: left half warm sunrise gradient `--sun-pale -> --sun-peach` with the `sun` icon, right half night `#0E1533 -> #1B2A66` with 14 twinkling stars and a crescent; the seam is a blurred 12% gradient so they "meet in the middle". Chat bubble shapes in the middle slowly morph (scale/opacity) into the memory icons `camera`, `film`, `mic`, `matcha`, `cookie` that float upward in a gentle S-curve (each 7-10s loop, staggered, rotate +-8deg). Icons stay readable on both halves (they have ink outlines; in the night half use `--icon-ink` light outline in dark theme).
4. **The little things** (`"Motmot parked by the highway at night with the two of them sitting together, food around and a rain cloud with a heart umbrella"`): night sky `#0E1533 -> #1B2A66` with stars; ground road band (dark `#1A2650` with dashed lane line animating slowly 1.5s); highway lamp posts (SVG) with warm `--glow` halos (flicker .9 <-> 1, 4s); green road sign plate `#5E9B4E` with white "NLEX" text (text on a plain plate); `motmot` icon (size 150) parked centre-left; `her` and `him` (size 56) sitting side by side on the roof/near the car (a tiny 2deg lean toward each other, breathing 4s); `fries`, `yogurt`, `churro` icons (size 44) orbiting gently in a loose ellipse (16-22s) around them; a small rain cloud (CSS blobs, `--sea-tint` fill) top-right with 8 raindrop streaks falling (1.1s linear loops) and a heart umbrella (SVG umbrella canopy with a tomato heart in the centre) held over the pair; the rain only falls on one side so the pair stays dry.
5. **A real one** (`"A little house being built brick by brick; the bricks read understanding, patience, trust and growth"`): a house frame made of 4 rows of bricks; each brick is a rounded rect (ink outline, `--citrus-tint`/`--sea-tint`/`--gelato-tint`/`--amalfi-tint`, text in Shantell 800 on the solid brick): bottom row **understanding** (wide), second **patience**, third **trust**, top **growth**; then a roof triangle (`--citrus` with outline) and door appear. Entry: bricks drop in from above one by one (spring `{300, 14}` with a tiny squash on landing: scaleY .85 -> 1, 450ms apart), roof last, then the `house` icon pops as the final thing and chimney smoke (3 circles rising and fading, 4s loop) starts. If a word is too wide on phones, font-size shrinks (clamp) and the brick wraps; the scene scales by `viewBox`.
6. **One memory at a time** (`"A road that goes on over the hills with Motmot riding toward the horizon and the dogs and plushies running along"`): three parallax hill layers (`--amalfi-tint`, `--sea-tint`, `--paper`) drifting at 40s/28s/18s loops; a road that curves to the horizon (perspective trapezoid) with lane dashes streaming toward the viewer (1.2s linear loop) so it feels endless; `motmot` (size 110) rides up the road, scaling from 1.0 to 0.35 over 8s as it nears the horizon, then re-emerges at the start (cross-fade); beside/behind it `dog`, `plush`, `ball`, `chimken`, `rorry` (size 48) trot in a line with offset bobbing (0.6s hop, 120ms apart); low `sun` on the horizon with soft rays rotating 60s. The text "not the end of the line" is NOT overlaid on the scene; it is in the text plate.
7. **To be continued** (`"Two hearts joined into one, and a blank page with a pen"`): left: two tomato hearts (SVG, ink outline) start apart, drift together and overlap into one joined heart (path morph or two overlapping shapes + a combined outline), 2.4s; then the joined heart beats (scale 1 -> 1.08 -> 1, 1.2s ease-in-out loop) with 5 tiny hearts/sparkles rising. Right page (desktop spread) / a peeking page corner under the text on phones: blank paper with faint lines, the text **"to be continued..."** in Caveat being written (clip-path reveal left-to-right 2.2s) and a `pen` doodle (new icon, see below) moving along as if writing, then resting with a small bob. On the last page the Next arrow is disabled; no extra words are added, the Close button pulses once gently instead.

### New icon needed
- `pen`: add to `GLYPHS` (64x64, same rules as other doodles): slanted fountain pen, body `M14 50 L44 20 L52 28 L22 58 Z` fill `--amalfi` `#1F55C9`, band `--gelato` stripe, nib `M14 50 L10 60 L22 58 Z` fill `#FFFFFF` with ink line, small ink dot at the tip, one white highlight line on the body. (If an `Icon` named `pen` already exists in the kit, reuse it.)

### Entry cards
- **Home "Our story" card**: a book-cover card (the same cover art at 110x150), Shantell title **"Our story"** (the heading of the source document), Caveat sub-line **"tap to read"**, `Button variant="primary"` "Read our story". The full title line appears only on the book cover. Placement: after "Recent memories" or beside the hero on desktop; id `our-story` for the anchor. States: loading n/a; nothing can fail (static), except lazy chunk load error -> toast "Couldn't open the book. Try again?".
- **Landing teaser** (`AuthPage.jsx`, below the sign-in card on phones, to the side of the hero on desktop): a closed-ish book showing page 1 (text + mini scene: hills and two small figures) on the left and page 7 (text + joined hearts) on the right, with a dotted "…" ribbon between them and Caveat caption **"a whole story in between"**; `Button variant="primary"` **"Read our story"**: it sets `?next=/home%23our-story`, opens/scrolls to the login card, and shows the helper text "Sign in to read it, love." After login, the existing redirect logic goes to `/home#our-story`. Pages 2-6 are not rendered or shipped to the logged-out bundle (lazy-load `OurStoryBook` only inside `/home`; the teaser uses its own tiny scene components).
- Dark theme (commit 03): book cover stays navy but lighter outline; pages use `--paper-warm`/`--surface`; scenes 3, 4, 6 already night/dark-friendly; scenes 1, 2, 5, 7 get dark sky variants via CSS variables on the scene root.

## 3. Files to change / add
Frontend:
- ADD `fsp_frontend/src/constants/ourStory.js`: verbatim story data (title, signed line, 7 pages).
- ADD `fsp_frontend/src/components/story/OurStoryBook/OurStoryBook.jsx` + `.module.css`: modal book, cover, spread/single layout, navigation, dots, a11y, focus.
- ADD `fsp_frontend/src/components/story/OurStoryBook/PageTurn.jsx`: desktop 3D curl / phone slide logic.
- ADD `fsp_frontend/src/components/story/scenes/Scene1Beginning.jsx` ... `Scene7Continued.jsx` + `scenes.module.css`, plus `SceneFrame.jsx` (shared box, aria-label, pause-when-hidden).
- ADD `fsp_frontend/src/components/story/StoryTeaser/StoryTeaser.jsx` + `.module.css`: landing teaser (pages 1 and 7 only).
- ADD `fsp_frontend/src/components/story/StoryCoverCard/StoryCoverCard.jsx`: Home card.
- ADD `fsp_frontend/src/hooks/usePageVisible.js` (document.hidden) and `useCoarsePointer` helper (or reuse `useMediaQuery`).
- ADD `scripts/check-our-story.mjs`: reads `docs/our-story.md`, normalises whitespace, compares to `constants/ourStory.js` bodies, exits non-zero on mismatch (run manually / in CI; no dependency).
- CHANGE `fsp_frontend/src/pages/HomePage.jsx` + `.module.css`: card + hash handling (`#our-story` scrolls and opens once).
- CHANGE `fsp_frontend/src/pages/AuthPage.jsx` + `.module.css`: teaser, `next` handling, helper text.
- CHANGE `fsp_frontend/src/context/AuthProvider.jsx` / `AuthPage` login redirect: honour a safe `next` (only same-origin paths starting with `/home`).
- CHANGE `fsp_frontend/src/components/Icon/glyphs.jsx`: add `pen` if missing.
Backend: none.

## 4. Data
None. No Flyway migration, no JPA, no DTOs. Static content (about 2 KB of text plus scene code, lazy-loaded). Per-device state only: `localStorage['fsp-story-seen']` (open the book automatically only the first time after a teaser login) and optionally `fsp-story-page`. Storage in the database: 0 bytes per item / 0 per 1,000.

## 5. API
None. (Optional later: a `GET /api/v1/story` if the text should become editable; out of scope.)

## 6. Edge cases and risks
- **Text drift**: the constants file is a copy of `docs/our-story.md`; `scripts/check-our-story.mjs` guards it. Do NOT "fix" grammar ("We did not cross paths normally, it was through…" stays as written).
- **Long text on small screens** (360x640): body scrolls inside the plate, fade hint; never clip silently.
- **3D transforms on low-end phones/Safari**: use 2D slide on phones; on desktop add `backface-visibility: hidden` and `will-change: transform` only during the turn; test Safari.
- **Battery**: only the active scene runs animations; pause on `document.hidden`; reduced motion static.
- **Logged-out bundle size**: the teaser must not import the full book or all scenes.
- **Open redirect**: `next` accepts only `/home...` paths; ignore anything else.
- **Two users**: no shared state; nothing to conflict.
- **Deleting / delete-all**: not applicable (static). Verify the "delete all" dialogs do not mention the story.
- **Old data / users with the book half-read**: no persistence beyond localStorage; clearing storage only resets the auto-open.
- **Accessibility**: heavy motion scenes are decorative; the text must be fully readable without them; `aria-live` announcements throttled to page changes.
- **Taglish/typography**: keep the apostrophes exactly (`we've`, `isn't`, `It's`, `there's`, `we're`, `it's`); use straight or curly consistently with the source (source uses straight `'`).

## 7. Acceptance checklist
- [ ] `node scripts/check-our-story.mjs` passes (text identical to `docs/our-story.md`).
- [ ] 390px: cover opens, every page readable without horizontal scroll, text plate scrolls when needed, swipe turns pages, dots/arrows >= 44px.
- [ ] 1440px: two-page spread, curl turn animation, arrow keys work, Esc closes.
- [ ] Landing teaser shows pages 1 and 7 only; "Read our story" -> login -> `/home#our-story` -> book opens.
- [ ] Each of the 7 scenes matches its visual note; ambient motion pauses off-screen.
- [ ] Dark mode: all pages readable; night scenes look intentional; cover contrast ok.
- [ ] Keyboard-only: open from Home card, turn pages, jump with Home/End, close, focus returns to the card.
- [ ] Screen reader: announces "Page N of 7: <title>"; scenes have short labels; body text is plain text.
- [ ] Reduced motion: crossfade only, no ambient animation.
- [ ] Works alongside the existing "delete all" features (no interaction).

# FILES I WILL PASTE BELOW
Frontend (shared, to reuse):
- docs/our-story.md (paste its content; it is the source text)
- fsp_frontend/src/components/ui/Modal/Modal.jsx and Modal.module.css
- fsp_frontend/src/components/ui/Button/Button.jsx and Button.module.css
- fsp_frontend/src/components/ui/IconButton/IconButton.jsx and IconButton.module.css
- fsp_frontend/src/components/Icon/Icon.jsx and glyphs.jsx (paste whole files; only add `pen` if missing)
- fsp_frontend/src/constants/animations.js
- fsp_frontend/src/constants/relationship.js
- fsp_frontend/src/hooks/useMediaQuery.js and useScrollLock.js
- fsp_frontend/src/styles/design-tokens.css
- fsp_frontend/src/components/landing/LandingScene.jsx (style reference for the scene motion; paste the part with Skyrie/Rorry/Motmot and the reduced-motion handling)
Frontend (related, to change):
- fsp_frontend/src/pages/AuthPage.jsx and AuthPage.module.css
- fsp_frontend/src/pages/HomePage.jsx and HomePage.module.css
- fsp_frontend/src/context/AuthProvider.jsx
- fsp_frontend/src/components/ProtectedRoute.jsx
- fsp_frontend/src/App.jsx
Backend: none.

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
