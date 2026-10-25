// Album accent swatches. The chosen colour drives the album card shadow and cover band, the album
// page header band, and the selected / highlighted photo rings (CSS variables --album-accent and
// --album-accent-ink, set inline by MemoriesPage). Tomato is not offered: it is reserved for
// primary actions and hearts.
// value = what is saved; ink = text colour on it in the light theme; css / inkCss = what is drawn, which
// follows the theme (Amalfi lightens and Ink becomes a periwinkle on navy so neither disappears).
export const PALETTE_ACCENTS = [
  { name: 'Citrus', value: '#FF9F1C', ink: '#172B70', css: '#FF9F1C', inkCss: 'var(--on-bright)' },
  { name: 'Sea', value: '#5CB3FF', ink: '#172B70', css: '#5CB3FF', inkCss: 'var(--on-bright)' },
  { name: 'Gelato', value: '#FFE680', ink: '#172B70', css: '#FFE680', inkCss: 'var(--on-bright)' },
  { name: 'Amalfi', value: '#1F55C9', ink: '#FFFFFF', css: 'var(--amalfi)', inkCss: 'var(--album-amalfi-on)' },
  { name: 'Ink', value: '#172B70', ink: '#FFFFFF', css: 'var(--album-ink-fill)', inkCss: 'var(--album-ink-on)' },
];

/** Colour choices for ColorSwatchGroup: the swatch is drawn in the theme-aware colour. */
export const ACCENT_SWATCHES = PALETTE_ACCENTS.map((a) => ({ value: a.value, name: a.name, color: a.css }));

export const DEFAULT_ACCENT = PALETTE_ACCENTS[0].value;

// Albums saved before the rebrand keep their old hex in the database (the old backend default was
// #C73616). They are not rewritten; on read each one gets a palette colour. Known old hexes map to
// their closest palette colour; the old default and anything else unknown is spread across the
// palette by album id so the grid is colourful instead of all orange.
const LEGACY_ACCENTS = {
  '#E38A96': '#FF9F1C',
  '#D97785': '#FF9F1C',
  '#F4A9B8': '#FFE680',
  '#8FAE7D': '#1F55C9',
  '#3E332E': '#172B70',
};
const SPREAD_LEGACY = new Set(['#C73616', '#E38A96', '#D97785']);

const isPalette = (hex) => PALETTE_ACCENTS.some((a) => a.value.toUpperCase() === hex);

function hashId(id) {
  let h = 0;
  for (const ch of String(id || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** Palette hex to draw for an album: { hex, ink }. Pass the album id so legacy values spread out. */
export function albumAccent(stored, id) {
  const upper = (stored || '').toUpperCase();
  let hex = DEFAULT_ACCENT;
  if (isPalette(upper)) {
    hex = PALETTE_ACCENTS.find((a) => a.value.toUpperCase() === upper).value;
  } else if (SPREAD_LEGACY.has(upper) && id) {
    hex = PALETTE_ACCENTS[hashId(id) % PALETTE_ACCENTS.length].value;
  } else if (LEGACY_ACCENTS[upper]) {
    hex = LEGACY_ACCENTS[upper];
  }
  const entry = PALETTE_ACCENTS.find((a) => a.value === hex);
  return { hex, ink: entry.ink };
}

/** CSS custom properties for an element (card, header, gallery). */
export function accentVars(stored, id) {
  const { hex } = albumAccent(stored, id);
  const entry = PALETTE_ACCENTS.find((a) => a.value === hex);
  return { '--album-accent': entry.css, '--album-accent-ink': entry.inkCss };
}
