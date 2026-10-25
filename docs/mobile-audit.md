# Mobile audit (final polish 09, part 9a)

Rows fixed in part 9b (Status column); the app was changed only for those fixes. Findings are grouped; a row can cover many identical elements.

## How it was run

- Local backend (jar built from the working tree, local Docker Postgres copy, port 8090) + production build of the frontend (`vite build`, served on 4180). Nothing touched Supabase.
- Headless Chrome (`puppeteer-core`), touch emulation, DPR 2, **360x740 and 390x844, light and dark**.
- **59 states x 4 configs = 236 runs.** Every route plus the main modal/drawer/sheet states: Auth (landing, login card, register card, story book), Home (+ notifications, account menu, story book, usual-orders menu), Memories (+ new/edit/delete album, delete-all, album, lightbox, upload sheet, Calendar Dump, Calendar Dump full screen), Dates (+ drawer, new form, edit form, delete confirm), Love Board (+ More menu, composer paper step, composer, stickers, search, layers, archived), Wheel (+ new wheel, open wheel), Pets (+ feed), Bouquets (gallery, editor with Wrap/Ribbon/Flowers/Card tabs, view, edit), Profile, and Admin (10 pages + sidebar, bell, delete confirm).
- Each state is scored by an in-page script: horizontal overflow, tap targets < 44x44, clipped/truncated text and text < 12px, content under the bottom tab bar, fixed/sticky items covering content, modals taller than the screen with no scroll container, keyboard-area risk, and text contrast (4.5:1, or 3:1 for text >= 24px / >= 18.66px bold). Text on gradients/images was measured from real pixels with the text hidden.
- The detectors were checked against seeded faults (wide element, tall non-scrolling dialog, low-contrast text, tiny button, content under the bar); all were caught. Two harness bugs were found and fixed that way before the final run (mobile emulation was widening `innerWidth` and hiding overflow; modal states were being read mid-animation).

## Clean (nothing found, in any of the 236 runs)

Horizontal overflow of the page or any element past the screen edge. Fixed/sticky items covering a control that can be scrolled to centre. Modals/drawers/sheets taller than the screen without a scroll container. Close buttons pushed off screen. Light-theme text contrast (every measurable text node >= 4.5:1, or >= 3:1 when large).

## 1. Content hidden behind the tab bar

| Route | Issue | Element | Fix idea | Status (9b) |
|---|---|---|---|---|
| `/bouquets/new` (same page serves `/bouquets/:id/edit`), Flowers tab | **Med.** At the bottom of the page the last row of flower names is 14px under the 78px tab bar, all sizes and themes | `.flowerName` (Leaf, Fern, Eucalyptus) in `components/bouquet/ToolTray` | Give the maker page / tray `padding-bottom: calc(78px + env(safe-area-inset-bottom) + 12px)` | Fixed: maker `.main` clears the bar; re-run clean. The 14px was partly a detector false positive (tiles scrolled out of the tray's own scroll box) |

## 2. Keyboard area (fields low on screen in sheets that cannot scroll)

Heuristic: a field whose bottom edge is below `viewport height - 300px` in a fixed container. Needs a quick check on a real phone; the emulator has no keyboard.

| Route | Issue | Element | Fix idea | Status (9b) |
|---|---|---|---|---|
| `/auth` login card and register card | **High.** Bottom-anchored card, no scroll. Username ends at y=496, password and invite code at y=588 of 740, so the keyboard covers them | `input#username`, `input#password`, `input#invite-code` | `max-height: 100dvh; overflow-y: auto` on the card, and scroll the focused field into view; or `interactive-widget=resizes-content` in the viewport meta | Fixed: card scrolls with `max-height` in dvh, `interactive-widget=resizes-content`, focused field scrolls to centre |
| `/memories` album open, "Add photos" sheet | **Med.** Caption ends at y=514, location at y=652, sheet not scrollable | `input#batch-caption`, `input#batch-location` | Same: `max-height` in `dvh` + scrollable body; keep the Upload button sticky | Fixed: Modal is dvh-capped with a scrolling body, sticky Upload button, `scroll-padding-bottom: 40dvh`, focus scrolls to centre |
| `/memories` "Delete all albums" confirm | **Med.** Type-to-confirm field at y=652, sheet not scrollable | `input#delete-all-phrase` | Same, or move the field above the explanatory text | Fixed: same Modal fix, Delete button sticky |
| `/wheel` "New wheel" | **Med.** Three inputs end at y=445, 538, 630 (360x740) and up to 734 (390x844); sheet not scrollable | the three `.input` fields (Saan pupunta? / Where to? / Where else?) | Same | Fixed: same Modal fix, Make the wheel button sticky |
| `/letters` search panel | **Low.** Paper filter select ends at y=576 on 360x740 only, container fixed and not scrollable | `select#lb-paper-filter` | Let the panel scroll, or show filters in a two-column row | Fixed: panel `max-height` in dvh, scroll padding |
| `/dates` new/edit form; `/memories` new/edit album; `/dates` drawer "New checklist step" | **Low.** Long forms (fields down to y~1570). These do scroll, so the browser can bring a focused field into view, but nothing reserves room for the keyboard | `.input`, `select`, `textarea` in the sheets; `input[aria-label="New checklist step"]` | `scroll-padding-bottom: 40dvh` on the sheet body so focus scrolling leaves room; test once on iOS Safari | Fixed: sticky Save row + scroll padding (shared form footer) |

## 3. Tap targets below 44x44

| Route | Issue | Element | Fix idea | Status (9b) |
|---|---|---|---|---|
| Every page with the footer (Home, Memories, Wheel, ...) | **Med.** Footer links "Home" 42x44 and "Dates" 41x44 | `.links a` in `components/layout/Footer/Footer.module.css:49` | `min-width: 44px` plus horizontal padding | Fixed: links 44px wide |
| `/dates`, `/memories` (also album open, Calendar Dump), Home notifications panel | **Med.** Search inputs are 24-25px tall (256-258px wide); only the input itself takes the tap | `input` "Search places, food, plans", "Search albums or captions", `.searchInput` | `min-height: 44px` on the input (or make the whole pill a label that focuses it) | Fixed: inputs `min-height: 44px` |
| `/memories` album list | **Med.** Album title buttons 25px tall (6 of 8 albums shown) | `.folderOpen` in `pages/MemoriesPage.module.css:243` | `min-height: 44px; display: inline-flex; align-items: center`, or make the whole card the hit area | Fixed: title buttons 44px high |
| `/dates` drawer, checklist | **Med.** "Mark done" checkbox 32x32, "Edit step" text button 130x32 | `.checklistCheckbox`, `.checklistTextEditable` in `pages/DatesPage.module.css:657,685` | Keep the visual size, add a 44px hit area (`::before { inset: -6px }`) or `min-height: 44px` | Fixed: checkbox is a 44px button drawing the same 32px box; text button 44px with negative margin so layout is unchanged |
| `/dates` new/edit form | **Low.** Cover photo file input 284x23 | `input#date-cover` | Style the file input as a 44px "Choose photo" button | Fixed: file input styled with a 36px button inside a 48px field (the 23px was the label) |
| Home story book (and the `/auth` story book) | **Low.** Page dots are 34x44 (8 buttons) | `.dot` in `components/story/OurStoryBook/OurStoryBook.module.css:112,124` | Widen the button to 44px and keep the 34px visible dot inside it | Fixed: dots are 44px wide, the row uses the sheet's side padding at 360 |
| `/letters` board | **Low.** Letter notes are 35-39 x 40-43 (14 notes). They are board objects scaled by zoom | `div[aria-label^="Open letter"]` | Minimum hit area of 44px (transparent `::before`), or fit-to-board zoom that keeps notes >= 44px | Fixed: the note's hit box grows to 44px when zoomed out, the note keeps its size |

## 4. Text under 12px

| Route | Issue | Element | Fix idea | Status (9b) |
|---|---|---|---|---|
| `/memories` Calendar Dump (and full screen) | **Med.** All 31 day numbers are 9.92px | `.dayNumber` in `components/memories/CalendarDump/CalendarView.module.css:239` (`clamp(0.62rem, 1.05vw, 0.85rem)`) | Raise the floor of the clamp to `0.75rem` | Fixed: clamp floor 0.75rem |
| `/admin` (all pages) | **Low.** Top bar "Admin Console / Merylle & Cj" 10.5px | `TopBar.jsx` breadcrumb | `text-xs` (12px) minimum | Fixed: `text-xs` |
| `/admin` sidebar (open) | **Low.** Section headings OVERVIEW, CONTENT, PEOPLE, COMMUNICATION, SYSTEM 10px | `Sidebar.jsx` `p.mb-1.5` | `text-xs` | Fixed: `text-xs` |
| `/admin`, `/admin/users`, `/activity`, `/memories`, `/letters`, `/dates` | **Low.** Badges and pills 11-11.5px: ADMIN/USER, Active, SUCCESS, COMPLETED, Connected/Reachable, "+N this week", mono ids; the "Disable" button is 11.5px | `span.rounded-full.px-2`, `button` in `DataTable` / dashboard cards | `text-xs` for pills; "Disable" at `text-[13px]` or larger | Fixed: `text-xs`, Disable `13px` |
| `/dates` drawer | **Low.** Progress ring label "0%" 11px | `.circularProgressLabel` | 12px | Fixed: 12px |
| `/auth` story cover | **Low.** "Our story" label 11.55px | `.coverTitle` | 12px | Fixed: `max(12px, 10.5cqw)` |

## 5. Contrast below 4.5:1 (dark theme only)

| Route | Issue | Element | Fix idea | Status (9b) |
|---|---|---|---|---|
| `/home` notifications panel, `/pets` | **Med.** Muted text 4.18:1 (`#97A8DB` on the unread-card `#4A4420`): "68d ago" times, pet mood "playful" | `.itemTime` (`Notifications.module.css:270`), `.tileMood` (`PetsPage.module.css:91`), both `var(--ink-muted)` | Dark `--ink-muted` in `design-tokens.css:119` from `#97A8DB` to about `#A6B6E6` (4.89:1 on that card; `#AEBDE8` gives 5.26:1). One token fixes both | Fixed: dark `--ink-muted` is `#A6B6E6` |
| `/profile` | **Med.** "Together for" label 2.48:1 (`#FF5A44` on butter `#FFE680`; large text needs 3:1) | `span.label` in the profile counter card | Use the dark ink on that card (`#1F2A5A`, 10.98:1) or `#B82A18` (4.99:1) | Fixed: the label is `--on-bright` (fixed dark ink), because the card stays butter in dark and `--ink` flips light |
| `/admin/users` | **Low.** "Disable" button 4.12:1 (`#F7796D` on `#4A3A22`) | `button` in the users table | Lighten to about `#FF9A8F` (5.35:1) in dark | Fixed: dark danger lightened |

## 6. Text cut off

| Route | Issue | Element | Fix idea | Status (9b) |
|---|---|---|---|---|
| Home "usual orders" menu | **Low.** Item names clamp at 2 lines: "Alcapone & Boston creme donuts" (81 vs 40px of room), "Angel's spinach pizza" (360 only) | `span.name` | Allow 3 lines, or add `title` + the full name in the edit dialog | Fixed: 3 lines plus a `title` with the full name |
| `/letters` board | **Low.** Note previews are clipped by the note box ("LOLZ XD" 37 vs 24px, "IM BACK BUBBA..." 45 vs 33px, and 2 more) | `div.absolute.overflow-hidden` note text | Size the box from the text, or clamp with an ellipsis so the cut looks intended | Fixed: line-clamped with an ellipsis (whole lines only); the full letter opens on tap |
| `/admin` dashboard | **Low.** Recent-item title ellipsis at 252px ("First Samgyup tgt and 3r...") | `span.truncate` | `title` attribute with the full text | Fixed: `title` with the full text |

## Re-run after the fixes (9b)

Same script, 236 runs on the full set, then the changed routes again. Zero tap-target, small-text, contrast, cut-off, under-tab-bar, overflow or too-tall issues remain. The detector was tightened in two places, so the first-pass numbers are not strictly comparable: an item scrolled out of its own scroll box no longer counts as under the bar, and a field inside a declared scroll container no longer counts as "not scrollable". The check still lists fields that sit low in bottom sheets (all of them now in scroll containers); that cannot reach zero without moving the fields, so it needs one test on a real phone.

## Not covered (follow-ups)

- Real keyboard and safe-area behaviour on iOS/Android (emulator only).
- Clicking a letter note on the Love Board opened no dialog at the tested point (notes are board objects), so the open-letter view is not audited. Same for tapping a Calendar Dump day, Story book pages 2-7, wheel spin result, drag/reorder, and toasts.
- Contrast is computed per text node from CSS colours (or sampled pixels over images), not for focus rings, icons or placeholder text.

Reproduce: scripts are in the session scratchpad, not in the repo (build with `VITE_API_URL=http://localhost:8090/api/v1`, run the backend on 8090 against the local Postgres copy, log in once and reuse the token: the backend rate-limits logins to 10 per 15 minutes per IP).
