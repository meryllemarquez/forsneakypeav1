// Wrap paper and ribbon pieces for the bouquet canvas (logical 400 x 500, gather point 200, 340).
// The artwork is identical in light and dark mode, so every colour is a fixed palette hex (no
// var(--x), no currentColor): the PNG export can serialize it as is and the paper still reads on
// a navy canvas thanks to the ink outline.

export const GATHER = { x: 200, y: 340 };
const INK = '#172B70';

export const WRAPS = [
  { value: 'kraft', label: 'Kraft', base: '#E2C98F' },
  { value: 'sea-dots', label: 'Sea dots', base: '#CDE7FF' },
  { value: 'citrus-stripes', label: 'Citrus stripes', base: '#FFD8A0' },
  { value: 'gelato-gingham', label: 'Gelato gingham', base: '#FFF0B3' },
  { value: 'cloud-white', label: 'Cloud white', base: '#FFFFFF' },
  { value: 'amalfi-stars', label: 'Amalfi stars', base: '#CBDBF8' },
];

// No tomato: pink stands in for red.
export const RIBBON_COLORS = [
  { value: 'sea', name: 'Sea', color: '#5CB3FF' },
  { value: 'citrus', name: 'Citrus', color: '#FF9F1C' },
  { value: 'gelato', name: 'Gelato', color: '#FFE680' },
  { value: 'amalfi', name: 'Amalfi', color: '#1F55C9' },
  { value: 'white', name: 'White', color: '#FFFFFF' },
  { value: 'pink', name: 'Pink', color: '#FF8FB1' },
];

const WRAP_BASE = Object.fromEntries(WRAPS.map((w) => [w.value, w.base]));
const RIBBON_HEX = Object.fromEntries(RIBBON_COLORS.map((c) => [c.value, c.color]));

export const wrapBase = (wrap) => WRAP_BASE[wrap] || WRAP_BASE.kraft;
export const ribbonHex = (color) => RIBBON_HEX[color] || RIBBON_HEX.sea;

const patternId = (uid, wrap) => `${uid}-wrap-${wrap}`;

// Put inside <defs>. `uid` keeps ids unique when many canvases share a page (gallery thumbnails).
export function WrapDefs({ uid }) {
  return (
    <>
      <pattern id={patternId(uid, 'kraft')} width="40" height="40" patternUnits="userSpaceOnUse">
        <rect width="40" height="40" fill="#E2C98F" />
        <path d="M0 14 L40 12 M0 32 L40 33" stroke="#D2B676" strokeWidth="1.4" />
      </pattern>
      <pattern id={patternId(uid, 'sea-dots')} width="24" height="24" patternUnits="userSpaceOnUse">
        <rect width="24" height="24" fill="#CDE7FF" />
        <circle cx="6" cy="6" r="3" fill="#FFFFFF" />
        <circle cx="18" cy="18" r="3" fill="#FFFFFF" />
      </pattern>
      <pattern id={patternId(uid, 'citrus-stripes')} width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)">
        <rect width="20" height="20" fill="#FFD8A0" />
        <rect width="20" height="9" fill="#FF9F1C" />
      </pattern>
      <pattern id={patternId(uid, 'gelato-gingham')} width="28" height="28" patternUnits="userSpaceOnUse">
        <rect width="28" height="28" fill="#FFF0B3" />
        <rect width="14" height="28" fill="#FFE680" opacity="0.7" />
        <rect width="28" height="14" fill="#FFE680" opacity="0.7" />
      </pattern>
      <pattern id={patternId(uid, 'cloud-white')} width="40" height="40" patternUnits="userSpaceOnUse">
        <rect width="40" height="40" fill="#FFFFFF" />
        <path d="M0 10 L40 10" stroke="#CDE7FF" strokeWidth="1.4" strokeDasharray="2 6" />
      </pattern>
      <pattern id={patternId(uid, 'amalfi-stars')} width="30" height="30" patternUnits="userSpaceOnUse">
        <rect width="30" height="30" fill="#CBDBF8" />
        <path d="M8 3 L9.2 6.6 L13 6.8 L10 9 L11 12.6 L8 10.5 L5 12.6 L6 9 L3 6.8 L6.8 6.6 Z" fill="#FFFFFF" />
        <path d="M23 18 L24 21 L27 21.2 L24.6 23 L25.4 26 L23 24.3 L20.6 26 L21.4 23 L19 21.2 L22 21 Z" fill="#FFFFFF" />
      </pattern>
    </>
  );
}

// Inner lining: drawn BEFORE the stems and flowers, so they look tucked inside the paper.
export function WrapBack({ wrap, uid }) {
  return (
    <path
      d="M200 332 L66 418 Q200 396 334 418 Z"
      fill={`url(#${patternId(uid, wrap)})`}
      stroke={INK}
      strokeWidth="2.6"
      strokeLinejoin="round"
      opacity="0.92"
    />
  );
}

// Front fan: drawn AFTER the stems and flowers. cloud-white gets a scalloped hem.
export function WrapFront({ wrap, uid }) {
  const hem =
    wrap === 'cloud-white'
      ? 'Q112 494 138 484 Q166 500 200 486 Q234 500 262 484 Q288 494 312 470'
      : 'Q200 496 312 470';
  return (
    <g stroke={INK} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
      <path d={`M200 340 L88 470 ${hem} Z`} fill={`url(#${patternId(uid, wrap)})`} />
      <path d="M200 344 L158 480" fill="none" opacity="0.55" strokeWidth="2" />
    </g>
  );
}

// Band and optional bow at the gather point. The bow pops in with a spring from the caller.
export function Ribbon({ style, color }) {
  if (style === 'none') return null;
  const fill = ribbonHex(color);
  const knot = { cx: GATHER.x, cy: GATHER.y + 8 };
  return (
    <g stroke={INK} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
      <path d="M168 330 Q200 342 232 330 L235 352 Q200 364 165 352 Z" fill={fill} />
      {style === 'bow' && (
        <>
          <path d={`M${knot.cx} ${knot.cy} C170 322 150 346 168 364 C182 372 194 358 ${knot.cx} ${knot.cy} Z`} fill={fill} />
          <path d={`M${knot.cx} ${knot.cy} C230 322 250 346 232 364 C218 372 206 358 ${knot.cx} ${knot.cy} Z`} fill={fill} />
          <path d={`M${knot.cx} ${knot.cy} L184 396 L196 392 Z`} fill={fill} />
          <path d={`M${knot.cx} ${knot.cy} L216 396 L204 392 Z`} fill={fill} />
          <circle cx={knot.cx} cy={knot.cy} r="7" fill={fill} />
        </>
      )}
    </g>
  );
}

// Mini preview for the Wrap tool tiles (and tests of the patterns in isolation).
export function WrapSwatch({ wrap, uid = 'swatch', size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 400 500" aria-hidden="true" focusable="false">
      <defs>
        <WrapDefs uid={uid} />
      </defs>
      <WrapFront wrap={wrap} uid={uid} />
    </svg>
  );
}
