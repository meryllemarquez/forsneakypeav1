// Spin the wheel: palette, limits and defaults. Tomato is deliberately not a wheel colour.
// Segment fills are fixed hexes (not theme tokens): they are vivid enough on navy, so the wheel
// looks the same in light and dark. Only the ring, outlines and surfaces follow the theme.
export const WHEEL_COLORS = [
  { value: 'sea', name: 'Sea', hex: '#5CB3FF' },
  { value: 'citrus', name: 'Citrus', hex: '#FF9F1C' },
  { value: 'gelato', name: 'Gelato', hex: '#FFE680' },
  { value: 'amalfi', name: 'Amalfi', hex: '#1F55C9', darkFill: true },
  { value: 'sea-tint', name: 'Sea tint', hex: '#CDE7FF' },
  { value: 'citrus-tint', name: 'Citrus tint', hex: '#FFD8A0' },
  { value: 'gelato-tint', name: 'Gelato tint', hex: '#FFF0B3' },
  { value: 'amalfi-tint', name: 'Amalfi tint', hex: '#CBDBF8' },
];

export const WHEEL_COLOR_BY_KEY = Object.fromEntries(WHEEL_COLORS.map((c) => [c.value, c]));

export const WHEEL_LIMITS = { minChoices: 2, maxChoices: 12, maxLabel: 40, maxName: 40 };

// Colours for new slices, walked in this order.
const WALK = WHEEL_COLORS.map((c) => c.value);

/**
 * Default colour keys for `count` slices: walks the palette, never repeating the previous
 * slice's colour (nor the first slice's colour on the last slice, since the wheel wraps).
 */
export function defaultWheelColors(count) {
  const out = [];
  let cursor = 0;
  for (let i = 0; i < count; i += 1) {
    let key = WALK[cursor % WALK.length];
    const clashes = (k) => k === out[i - 1] || (i === count - 1 && count > 1 && k === out[0]);
    while (clashes(key)) {
      cursor += 1;
      key = WALK[cursor % WALK.length];
    }
    out.push(key);
    cursor += 1;
  }
  return out;
}

// Doodles a slice can wear (food and places). All are in the server's allow-list.
export const WHEEL_DOODLES = [
  'lasagna', 'pizza', 'burger', 'ramen', 'bowl', 'lechon', 'fries', 'donut',
  'cake', 'iceCream', 'milkTea', 'coffee', 'motmot', 'mountain', 'museum', 'plane',
];

export const newChoiceId = () => Math.random().toString(36).slice(2, 10);

/** Colour for a slice appended to `choices`: next on the palette, unlike the last and first slice. */
export function nextWheelColor(choices) {
  const prev = choices[choices.length - 1]?.color;
  const first = choices[0]?.color;
  for (let i = 0; i < WALK.length; i += 1) {
    const key = WALK[(choices.length + i) % WALK.length];
    if (key !== prev && key !== first) return key;
  }
  return WALK[0];
}

// Menu foods keep their "loved by" colour; a tint breaks up neighbours that would match.
const LOVED_COLORS = {
  her: ['citrus', 'citrus-tint'],
  him: ['sea', 'sea-tint'],
  both: ['gelato', 'gelato-tint'],
};

/** `existing` choices plus menu foods (skipping ones already there) up to `limit` slices. */
export function choicesFromMenu(items, existing = [], limit = WHEEL_LIMITS.maxChoices) {
  const out = [...existing];
  const have = new Set(out.map((c) => c.label.trim().toLowerCase()));
  for (const item of items) {
    if (out.length >= limit) break;
    const label = (item.name || '').trim().slice(0, WHEEL_LIMITS.maxLabel);
    if (!label || have.has(label.toLowerCase())) continue;
    const [base, tint] = LOVED_COLORS[item.lovedBy] || LOVED_COLORS.both;
    const color = out[out.length - 1]?.color === base ? tint : base;
    out.push({ id: newChoiceId(), label, color, doodle: item.doodle || null });
    have.add(label.toLowerCase());
  }
  return out;
}

// The wheel last opened (or added to), so "add to a wheel" can skip the picker.
const LAST_WHEEL_KEY = 'fsp-wheel-last';
export function rememberWheel(id) {
  try {
    localStorage.setItem(LAST_WHEEL_KEY, id);
  } catch {
    /* not remembered */
  }
}
export function lastWheelId() {
  try {
    return localStorage.getItem(LAST_WHEEL_KEY);
  } catch {
    return null;
  }
}
