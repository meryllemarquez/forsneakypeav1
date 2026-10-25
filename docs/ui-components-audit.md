# UI components audit (read-only)

Scope: every small control in `fsp_frontend/src`, read from code only (no builds, no screenshots, nothing run).
Reference: `docs/rebrand/Icons.dc.html` plus `styles/design-tokens.css`, `Button`, `Modal`, `ConfirmDialog`, `FormControls.module.css`, toasts.
Severity: High = blocks use or access, Med = inconsistent or hard to use, Low = polish. Line numbers are as of this audit.

**What is already good:** `Modal` (Esc, focus trap and restore, scroll lock, bottom sheet under 480px), `ConfirmDialog`, the global 3px tomato focus ring (`reset.css:43`), the shared switch (`FormControls`), `StatusChip`, `aria-pressed` on Dates filter chips, and the 44px `--tap` token. Most icon-only buttons are labelled.

## 1. Shared components (the root causes)

| Sev | Component + file:line | Problem | Fix |
|---|---|---|---|
| High | Parallel button sets: `Button.jsx:7` vs `lbUi.jsx:11-58` (Chip/PillButton/RoundButton), `ProfilePage.module.css:394,471` (primaryActionBtn, saveFooterBtn...), `AuthPage.jsx:177,244` (cta, primaryBtn), Admin Tailwind buttons | Four or five button dialects with different heights, shadows and hover | One `Button` plus `IconButton` (44px, required `label`) plus `Chip`; migrate the one-offs |
| Med | `Button.jsx` / `Button.module.css` | No loading state, no danger variant, no icon-only form; secondary has no offset shadow | Add `loading`, `variant="danger"`, `IconButton` |
| Med | `ConfirmDialog.jsx:31` | Destructive confirms use the tomato primary, so tomato means both "do it" and "delete" | Add a danger style (ink fill or citrus) and keep tomato for the main action |
| Med | `FormControls.module.css:23-45` | No `:disabled`, `[aria-invalid]` or error-border styles; `.select` keeps the native arrow; no checkbox or radio style | Add disabled/invalid states, `Field` wrapper with `aria-describedby`, shared `Select` |
| Med | Two field systems: `FormControls` vs `ProfilePage.module.css:294-317` (`inputField`, `inputError`) vs `lbUi.jsx:8` (`inputClass`) vs Admin inputs | Same input, three looks and radii | One `Field`/`Input`/`Textarea` used by all |
| Low | `App.css` (Vite boilerplate, `App.css:14` uses `--accent`) | Dead file, not imported | Delete |

## 2. Pickers and selectors

| Sev | Component + file:line | Problem | Fix |
|---|---|---|---|
| High | Date and time: `DatesPage.jsx:1260,1263` (native), `MemoriesPage.jsx:1021`, checklist due date `DatesPage.jsx:319` | Native `date`/`time` inputs look different per browser, tiny on phones, off-brand | Shared `DatePicker`/`TimePicker` that opens as a bottom sheet on phones |
| Med | Native `<select>`: `DatesPage.jsx:1240,1287,1292,1300`, `DatesPage.jsx:320`, `SearchFilterPanel.jsx:85`, `FilterBar.jsx:22`, `CalendarView.jsx:65` | OS popup, off-brand, tiny option rows on phones | Shared `Select` (button + sheet) |
| Med | Status chosen with a `<select>` (`DatesPage.jsx:1300`) although `StatusChip` exists | Status colours never shown while choosing | Chip radio group using `StatusChip` colours |
| High | `MonthYearPicker` `CalendarView.jsx:44-80` | Year field is controlled and rejects partial input, so you cannot clear and retype it; popover is a small floating box; no focus move into it | Sheet with month grid plus year stepper (arrows), focus on open |
| Med | Accent swatches: `MemoriesPage.jsx:~1000` and `ProfilePage.jsx:384-400` | Two implementations; Memories shows selection by ring only, Profile adds a check; labels are colour names only in one | One `ColorSwatch` group with a check mark and the colour name |
| Med | Doodle, cover, swatch, paper and emoji groups use `role="radio"` on buttons (`MemoriesPage.jsx:~911`, `PaperPicker.jsx:8`, `ProfilePage.jsx:384`) | No arrow-key navigation or roving tabindex, so each option is a tab stop | Shared `RadioGroup`/`OptionGrid` with arrow keys |
| Med | `PaperPicker.jsx:18`, `FontPicker.jsx:15`, `MoodPicker.jsx:7`, `StickerLibrary` chips | Selected state is a citrus fill only; `MoodPicker` and `FontPicker` are single-choice but use `aria-pressed` toggles | Add check mark or heavier border; use radio semantics |
| Med | Text colour swatches `NoteCanvasEditor.jsx:~190`, `loveBoardConstants.js:52` | `aria-label="Text colour #2b2b2b"` (hex, not a name); `#2b2b2b`, `#1f4d3d`, `#6b3f6b` are off-palette | Name the colours; move to tokens or document them as user-content colours |
| Low | Sliders `NoteCanvasEditor.jsx:151,207,219`, `AvatarCropModal.jsx:182` | Native range, tomato accent (tomato is "primary only"), no value readout | Styled `Slider` with ink track and visible value |

## 3. Inputs, textareas, checkboxes, toggles

| Sev | Component + file:line | Problem | Fix |
|---|---|---|---|
| Med | Checkboxes `NoteComposerModal.jsx:119`, `NoteReaderModal.jsx:164` | Native checkbox with tomato accent; the same "private" choice in Memories uses the shared citrus switch | Use the shared `Switch` everywhere |
| Med | Required and error states: no `aria-invalid` anywhere in `src` | Errors are text only, not tied to the field | `Field` wrapper sets `aria-invalid` + `aria-describedby` |
| Med | `AuthPage.jsx:236,278,340` | Password fields have no show/hide toggle (hard to type on a phone) | Add toggle button with a label |
| Med | `MemoriesPage.jsx:1070`, `DatesPage.jsx:1321`, `ProfilePage.jsx:461` | Bare or hidden native file inputs; the date cover input is an unstyled file field | Shared `FilePicker` (drop zone + preview + remove) |
| Low | `DatesPage.jsx:1266,1307` (`type=number`) | Native spinners; `inputMode` not set | `inputMode="numeric"`/`"decimal"`, hide spinners |
| Low | `FilterBar.jsx:14`, `TopBar.jsx:31` | Search inputs have only a placeholder, no label; TopBar search does nothing | Add `aria-label`; remove or wire it |

## 4. Buttons and icon-only controls

| Sev | Component + file:line | Problem | Fix |
|---|---|---|---|
| High | `TopBar.jsx:38` admin bell | No accessible name (only a count badge) | `aria-label="Notifications, N unread"` |
| High | `NotificationDrawer.jsx:55` close | No label, 32px | Label, 44px |
| High | `Pagination.jsx:12,20` | Prev/next have no label, 32px | Labels, 44px |
| High | Admin row actions `AdminDatesPage.jsx:95,103`, `AdminLettersPage.jsx:91,99`, `AdminMemoriesPage.jsx:102,110` | 28px, name is only `title="Delete"` (not row-specific) | `IconButton` 44px, `aria-label="Delete {name}"` |
| High | `AdminGalleryPage.jsx:81-88`, `NotificationCard.jsx:65` | Actions appear only on hover (`opacity-0 group-hover`), so touch and keyboard users never see them | Always visible (or `focus-within`), 44px |
| Med | `AttachmentHandle.jsx:118`, `TextBoxHandle.jsx:181`, `Sticker.jsx:210` | Unlabelled drag/resize/rotate handles; pointer-only; 32px hit area on the first two | Labels and keyboard nudge (arrows) or a toolbar alternative |
| Med | `DatesPage.jsx:~248` checklist checkbox (`DatesPage.module.css:639`, 32px) | Under 44px; a button with a changing label instead of `role="checkbox"`/`aria-checked` | 44px target, checkbox semantics |
| Med | `DatesPage.jsx:241` drag handle | Reorder only by pointer | Add Move up/down in the row menu |
| Low | `CalendarView.jsx:392-455`, `ProfilePage.jsx:250,264,511` | `<button>` without `type` | Add `type="button"` |

## 5. Dialogs, drawers, popovers

| Sev | Component + file:line | Problem | Fix |
|---|---|---|---|
| High | `NotificationDrawer.jsx:37-55` (admin) | Not a real dialog: no role, no Esc, no focus trap or restore | Reuse `Modal placement="right"` |
| Med | `CalendarView.jsx:422` fullscreen, `MemoriesPage.jsx:1121` lightbox, `AuthPage.jsx:199` auth card, `NotificationPanel.jsx:76` | Hand-rolled `aria-modal` dialogs: Esc works, but no focus trap or focus restore | Build on `Modal` (add a `variant="dark"`/`fullscreen`) |
| Med | `lbUi.jsx:97` `DrawerPanel`, `BoardMenu.jsx:71`, `AdminLayout.jsx:66` | Third and fourth drawer/popover implementations; BoardMenu is a floating panel on phones, "Delete all..." sits in it as a plain item | `Modal` sheet on phones; danger-styled delete |
| Med | `Navbar.jsx:67` `role="menu"` | Menu items without arrow-key navigation | Roving focus, or drop `role="menu"` for a plain list |
| Low | `Modal.module.css:132` drawer on phones | Drawer loses its ink border and shadow, so it looks flat vs sheets | Keep a 2px top border |

## 6. Chips, tabs, filters

| Sev | Component + file:line | Problem | Fix |
|---|---|---|---|
| Med | `MemoriesPage.jsx:642-660` tablist | `role="tab"` but no arrow keys, no `aria-controls`/tabpanel | Shared `Tabs` |
| Med | `NotificationDrawer.jsx:76` filter buttons | Active filter shown by colour only, no `aria-pressed` | `Chip` with `aria-pressed` |
| Med | Chip implementations: `DatesPage.module.css:157` `filterChip`, `lbUi.jsx:13` `Chip`, `Notifications.module.css` filter chips, Admin pills | Same control, different padding and active colour | One `Chip` |
| Low | Admin tiny text (`text-[10.5px]`, `text-[11px]` in `TopBar.jsx`, `NotificationCard.jsx`) | Hard to read on phones | 12px minimum |

## 7. Feedback: toasts, empty, loading

| Sev | Component + file:line | Problem | Fix |
|---|---|---|---|
| Med | `Notification.jsx:6` | Error and info both use the bell icon; only the tint differs (not colour-only safe) | Distinct icon or "Error:" prefix; pause on hover/focus |
| Low | `Notification.jsx:11,17` | `aria-live` on the container plus `role` on each toast may announce twice | Keep one |
| Med | `ProtectedRoute.jsx:9-10` | Unstyled "Loading application..." with an emoji and a non-existent var (`--color-brown-primary`) | Use `PageLoader` |
| Low | `NotificationPanel.jsx:~129`, `HomePage.jsx:270` | Plain "Loading..." text | Shared skeleton or the `PageLoader` heart |
| Low | Empty states: Admin has `EmptyState.jsx`; Memories, Dates, Letters each have their own | Different layouts and sticker use | Shared `EmptyState` for the couple pages |
| Low | `CalendarView.jsx:407,453` | Mojibake in the visible label: "Exportingâ€¦" (also in comments, lines 19,193,198) | Re-save the file as UTF-8, restore "Exporting..." |

## 8. Brand and tokens

| Sev | Component + file:line | Problem | Fix |
|---|---|---|---|
| Med | Admin dialect: `FilterBar.jsx:14-27`, `Pagination.jsx`, row buttons | 1px borders, `rounded-lg`, 13px text, focus ring is `ring-2 .../15` (faint) instead of the 3px tomato ring; `outline-none` on inputs | Move Admin to the shared 2px ink + focus tokens, or document it as an intentional calm variant |
| Med | Tomato used outside "primary and hearts": `accent-(--tomato)` on checkboxes/sliders, tomato eyebrow labels (`lbUi`, `NoteComposerModal.jsx:71`) | Breaks the one-tomato rule in the guide | Use ink/citrus for controls; decide if handwritten tomato eyebrows are an allowed exception |
| Low | Hard-coded colours: `#C9D6EC` (`ProfilePage.module.css:259`, `HomePage.module.css:403`, `DatesPage.module.css:380`), `#E3EEFF` (`Footer.module.css:40,81`), `AuthPage.module.css:11,21`, `#fffdf6` (`lbGraphics.module.css:56`, `loveboard-tailwind.css:43`), `DashboardHome.jsx:44-49,263`, `DatesPage.jsx:238` | Same values repeated outside tokens | Add `--line-soft`, `--footer-ink`, use existing tokens |
| Low | `Button.module.css` `.secondary` | No offset shadow; only primary has one (guide says offset shadow on buttons) | Decide: add `--shadow-button-soft` or document |
| Low | `ProfilePage.jsx:410` emoji picker, `ProtectedRoute.jsx:10` | Emoji in UI chrome vs the Love Board "no emoji in chrome" rule | Keep only where the user picks it (Profile), remove elsewhere |

## Top 10 fixes (priority order)

1. Admin touch and a11y: label the bell, drawer close and pagination; 44px targets; row actions always visible (section 4, 5 rows marked High).
2. Replace the admin `NotificationDrawer` with `Modal placement="right"` (focus trap, Esc).
3. Shared `IconButton` (44px, required `label`) and use it for all icon-only buttons, including the Love Board handles.
4. Shared `DatePicker`/`TimePicker` sheet instead of native inputs (Dates form, Memories form, checklist).
5. Fix `MonthYearPicker` (year field cannot be edited; make it a sheet).
6. Shared `Select` (button + sheet) and a status chip group for Dates status.
7. `Field`/`Input` with error, disabled and `aria-invalid`; retire `ProfilePage` and `lbUi` input styles.
8. One `Button` (add loading, danger); migrate Profile, Auth and Love Board one-offs; danger style in `ConfirmDialog`.
9. Build the hand-rolled dialogs (lightbox, calendar fullscreen, auth card, notification panel, Love Board drawer) on `Modal`.
10. Shared `RadioGroup`/`OptionGrid` (arrow keys, check mark) for doodle, cover, swatch, paper, font, mood; plus `Tabs`, `Chip`, `Switch` reuse.

**Solved by one shared component:** `IconButton` (1, 3), `DatePicker`/`TimePicker` (4, 5), `Select` (6), `Field` (7), `Button` (8), `Modal` variants (2, 9), `RadioGroup` + `ColorSwatch` + `Chip` + `Tabs` (10).
**Needs a one-off fix:** the mojibake label in `CalendarView.jsx`, the hover-only actions, the `ProtectedRoute` loader, the off-token hex values.
