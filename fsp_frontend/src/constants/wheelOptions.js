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
