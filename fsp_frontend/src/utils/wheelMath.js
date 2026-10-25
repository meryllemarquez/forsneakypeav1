// Pure geometry + randomness for the spin wheel (no React, easy to unit-test).
//
// Angle convention: degrees clockwise from 12 o'clock. Slice i covers [i*step, (i+1)*step] in the
// wheel's own frame. The pointer sits at 12 o'clock, so after the wheel is rotated by R degrees the
// wheel-frame angle under the pointer is -R (mod 360).

export const norm = (deg) => ((deg % 360) + 360) % 360;

function randomUint32() {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return buf[0];
}

/** Uniform integer in [0, n) by rejection sampling (no modulo bias). */
export function randomInt(n) {
  const limit = Math.floor(0x100000000 / n) * n;
  let x = randomUint32();
  while (x >= limit) x = randomUint32();
  return x % n;
}

/** Uniform float in [0, 1). */
export const randomUnit = () => randomUint32() / 0x100000000;

export const segmentStep = (count) => 360 / count;

/**
 * Decide the winner before any animation. The landing angle (wheel frame) is random inside the
 * winning slice but kept 15% away from both edges, so the pointer never rests on a line.
 */
export function pickWinner(count) {
  const step = segmentStep(count);
  const index = randomInt(count);
  const angle = step * (index + 0.15 + 0.7 * randomUnit());
  return { index, angle };
}

/** Final rotation that brings wheel-frame `angle` under the pointer after `turns` extra full turns. */
export function rotationFor(current, angle, turns) {
  return current + turns * 360 + norm(-angle - current);
}

/** Index of the slice currently under the pointer for a given rotation. */
export function segmentUnderPointer(rotation, count) {
  const index = Math.floor(norm(-rotation) / segmentStep(count));
  return Math.min(count - 1, Math.max(0, index));
}

/** Point at `deg` (clockwise from 12 o'clock) and radius `r` around (cx, cy). */
export function polar(cx, cy, r, deg) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

/** SVG path for a pie slice from a0 to a1 degrees. */
export function slicePath(cx, cy, r, a0, a1) {
  const start = polar(cx, cy, r, a0);
  const end = polar(cx, cy, r, a1);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${cx} ${cy} L${start.x.toFixed(3)} ${start.y.toFixed(3)} A${r} ${r} 0 ${large} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)} Z`;
}

/** Wheel label: 12 chars at 7+ slices, 16 at 6 or fewer. Full text lives elsewhere. */
export function truncateLabel(label, count) {
  const max = count >= 7 ? 12 : 16;
  const text = label.trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/**
 * Font size (SVG units) that fits `chars` characters into `length` units along the radius and
 * into the slice's width at mid-label, within [min, max].
 */
export function labelFontSize(chars, length, midRadius, count, { min = 9, max = 20 } = {}) {
  const sliceWidth = 2 * midRadius * Math.sin((Math.PI / count) * 0.9);
  const byLength = length / (Math.max(chars, 1) * 0.62);
  return Math.max(min, Math.min(max, byLength, sliceWidth * 0.55));
}
