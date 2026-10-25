import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useAnimationControls, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { GLYPHS, RORRY_BODY } from '../Icon/glyphs';
import styles from './LandingScene.module.css';

/*
  The landing page's cozy little scene, painted in soft layers: sky, sun, clouds, far mountains,
  rolling hills, a house with a warm window, a leafy tree, and the family out front. All SVG + CSS
  (no images). The background has no outlines; only the characters keep the ink outline so they pop.

  Two compositions share the same drawings:
    wide (desktop, landscape)  one 1200x760 scene
    phone (portrait)           a tall 400x800 scene: sun and clouds in a strip at the top, then the
                               house and tree, with the plushies and the dogs in two rows below

  Touch / mouse:
    dogs and plushies  hover, focus or tap: they wiggle and say their name
    Rorry              click: flips over (teal grumpy <-> pink happy)
    Motmot             click: drives across the road and back
    Skyrie             tap: big bounce
    sky, hills         drift gently with the mouse (parallax, mouse only)
  With prefers-reduced-motion nothing moves; characters only show their speech bubble.
*/

const INK = 'var(--icon-ink)';

// Small seeded random so the grass, petals and fireflies are the same on every render.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

function tufts(rand, count, x0, x1, y0, y1) {
  return Array.from({ length: count }, () => {
    const x = (x0 + rand() * (x1 - x0)).toFixed(0);
    const y = (y0 + rand() * (y1 - y0)).toFixed(0);
    const h = 7 + rand() * 7;
    return `M${x} ${y} q-2 -${h * 0.6} -4 -${h} M${x} ${y} q0 -${h * 0.7} 0 -${h + 3} M${x} ${y} q2 -${h * 0.6} 4 -${h}`;
  }).join(' ');
}

const rand = seeded(42);
const TUFT_PATH = tufts(rand, 90, -40, 1240, 648, 720);
const TUFT_PATH_PHONE = tufts(seeded(7), 34, -10, 410, 604, 745);

const STARS = Array.from({ length: 46 }, () => ({
  x: -100 + rand() * 1400,
  y: -60 + rand() * 500,
  r: 0.9 + rand() * 1.5,
  delay: -rand() * 6,
  dur: 2.6 + rand() * 3,
}));

const STARS_PHONE = Array.from({ length: 30 }, () => ({
  x: rand() * 400,
  y: rand() * 430,
  r: 0.9 + rand() * 1.5,
  delay: -rand() * 6,
  dur: 2.6 + rand() * 3,
}));

const FIREFLIES = Array.from({ length: 12 }, () => ({
  x: 40 + rand() * 1120,
  y: 470 + rand() * 230,
  dx: -30 + rand() * 60,
  dy: -40 + rand() * 40,
  delay: -rand() * 8,
  dur: 6 + rand() * 6,
}));

const FIREFLIES_PHONE = Array.from({ length: 5 }, () => ({
  x: 30 + rand() * 340,
  y: 520 + rand() * 200,
  dx: -20 + rand() * 40,
  dy: -30 + rand() * 30,
  delay: -rand() * 8,
  dur: 7 + rand() * 5,
}));

const PETALS = Array.from({ length: 9 }, (_, i) => ({
  x: 80 + i * 130 + rand() * 60,
  y: 120 + rand() * 200,
  delay: -rand() * 14,
  dur: 14 + rand() * 8,
  color: i % 2 ? '#FFC2D4' : '#FFFFFF',
}));

const WILDFLOWERS = [
  { x: 36, y: 668, c: '#FF8FB1' },
  { x: 58, y: 676, c: '#FFFFFF' },
  { x: 308, y: 672, c: '#FFE680' },
  { x: 338, y: 680, c: '#FF8FB1' },
  { x: 588, y: 740, c: '#FFFFFF' },
  { x: 1156, y: 664, c: '#FF8FB1' },
  { x: 1178, y: 676, c: '#FFE680' },
  { x: 1128, y: 684, c: '#FFFFFF' },
  { x: 700, y: 694, c: '#FFE680' },
  { x: 880, y: 698, c: '#FF8FB1' },
];

const WILDFLOWERS_PHONE = [
  { x: 12, y: 628, c: '#FF8FB1' },
  { x: 262, y: 640, c: '#FFE680' },
  { x: 386, y: 640, c: '#FFFFFF' },
  { x: 12, y: 700, c: '#FFE680' },
  { x: 388, y: 706, c: '#FF8FB1' },
];

// Where each character stands, per composition. y is the top of the 64-unit drawing's box.
const WIDE = {
  bounds: [0, 1200],
  junebug: { x: 330, y: 660, size: 62 },
  chimken: { x: 402, y: 638, size: 88 },
  rorry: { x: 500, y: 652, size: 70 },
  skyrie: { x: 1050, y: 632, size: 90 },
  motmot: { x: 86, y: 672, size: 100, travel: 860 },
  dogs: { y: 726, xs: [580, 664, 772, 866, 946], sizes: [76, 100, 86, 74, 94] },
};

const PHONE = {
  bounds: [14, 386],
  junebug: { x: 34, y: 610, size: 58 },
  chimken: { x: 100, y: 592, size: 76 },
  rorry: { x: 186, y: 606, size: 62 },
  skyrie: { x: 264, y: 596, size: 72 },
  motmot: { x: 14, y: 728, size: 66, travel: 296 },
  dogs: { y: 742, xs: [28, 96, 174, 246, 312], sizes: [54, 64, 58, 52, 60] },
};

function useShift(source, factor) {
  return useTransform(source, (v) => v * factor);
}

// A kit doodle (or any 64-unit drawing) inside the scene, scaled to `size`.
function Glyph({ name, x = 0, y = 0, size = 64, children }) {
  return (
    <svg
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      overflow="visible"
      fill="none"
      stroke={INK}
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name ? GLYPHS[name] : null}
      {children}
    </svg>
  );
}

// Speech bubble; kept inside `bounds` so it never runs off the edge of a narrow screen.
function Bubble({ cx, y, text, show, bounds }) {
  const width = text.length * 11 + 34;
  const x = Math.min(Math.max(cx, bounds[0] + width / 2), bounds[1] - width / 2);
  const tip = Math.min(Math.max(cx - (x - width / 2), 20), width - 20);
  return (
    <g className={styles.bubble} data-show={show} transform={`translate(${x - width / 2} ${y})`} aria-hidden="true">
      <rect width={width} height="42" rx="21" fill="var(--surface)" stroke={INK} strokeWidth="3" />
      <path d={`M${tip - 8} 41 L${tip} 54 L${tip + 8} 41`} fill="var(--surface)" stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d={`M${tip - 6} 40 H${tip + 6}`} stroke="var(--surface)" strokeWidth="5" />
      <text x={width / 2} y="29" textAnchor="middle" className={styles.bubbleText}>
        {text}
      </text>
    </g>
  );
}

// A big soft cumulus: overlapping puffs, a light top and a bluish underside. No outline.
function Cloud({ x, y, scale = 1, duration = 30, delay = 0, opacity = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity} aria-hidden="true">
      <g className={styles.drift} style={{ '--duration': `${duration}s`, '--delay': `${delay}s` }}>
        <ellipse cx="102" cy="76" rx="100" ry="12" fill="var(--ls-cloud-shade)" opacity="0.45" />
        <g fill="url(#lsCloud)">
          <circle cx="30" cy="54" r="24" />
          <circle cx="62" cy="38" r="32" />
          <circle cx="104" cy="30" r="38" />
          <circle cx="146" cy="46" r="30" />
          <circle cx="176" cy="58" r="20" />
          <rect x="14" y="52" width="176" height="24" rx="12" />
        </g>
        <circle cx="96" cy="20" r="22" fill="var(--ls-cloud-hi)" opacity="0.7" />
        <circle cx="58" cy="30" r="14" fill="var(--ls-cloud-hi)" opacity="0.6" />
      </g>
    </g>
  );
}

function Sun({ x, y }) {
  const rays = Array.from({ length: 12 }, (_, i) => i * 30);
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      <circle className={styles.halo} r="86" fill="url(#lsGlow)" />
      <g className={styles.sun}>
        {rays.map((a) => (
          <path key={a} d="M0 -40 V-54" stroke="var(--ls-sun-ray)" strokeWidth="5" strokeLinecap="round" transform={`rotate(${a})`} />
        ))}
      </g>
      <circle r="31" fill="var(--ls-sun-fill)" />
      <circle r="31" fill="url(#lsSunDisc)" />
      <ellipse cx="-10" cy="-2" rx="2.4" ry="4" fill={INK} />
      <ellipse cx="10" cy="-2" rx="2.4" ry="4" fill={INK} />
      <circle cx="-17" cy="8" r="4.2" fill="var(--ls-sun-cheek)" opacity="0.5" />
      <circle cx="17" cy="8" r="4.2" fill="var(--ls-sun-cheek)" opacity="0.5" />
      <path d="M-8 9 Q0 15 8 9" fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
    </g>
  );
}

function Wild({ x, y, c }) {
  return (
    <g>
      <path d={`M${x} ${y} q-2 10 0 18`} stroke="var(--ls-tuft)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx={x} cy={y} r="4" fill={c} />
      <circle cx={x} cy={y} r="1.5" fill="#FF9F1C" />
    </g>
  );
}

// Big leafy tree, drawn with its trunk base at (418, 650).
function Tree() {
  return (
    <g className={styles.sway}>
      <path d="M414 650 C416 620 410 596 404 574 L430 574 C426 598 434 622 438 650 Z" fill="var(--ls-trunk)" />
      <path d="M424 600 L452 570 M420 590 L398 566" stroke="var(--ls-trunk)" strokeWidth="6" strokeLinecap="round" fill="none" />
      <g fill="var(--ls-leaf-0)">
        <circle cx="372" cy="520" r="44" />
        <circle cx="470" cy="516" r="48" />
        <circle cx="420" cy="470" r="56" />
        <circle cx="418" cy="548" r="46" />
      </g>
      <g fill="var(--ls-leaf-1)">
        <circle cx="386" cy="510" r="34" />
        <circle cx="462" cy="500" r="36" />
        <circle cx="418" cy="470" r="42" />
        <circle cx="420" cy="534" r="34" />
      </g>
      <g fill="var(--ls-leaf-2)" opacity="0.9">
        <circle cx="396" cy="486" r="18" />
        <circle cx="440" cy="458" r="20" />
        <circle cx="470" cy="494" r="14" />
        <circle cx="376" cy="522" r="12" />
      </g>
    </g>
  );
}

// A slimmer second tree for the right side: an upright, pointed canopy so it is not a copy of the big round one.
// Same trunk base (418, 650), so it can be placed with a transform.
function TreeB() {
  return (
    <g className={styles.sway} style={{ animationDelay: '-3s' }}>
      <path d="M416 650 C418 628 416 604 413 580 L425 580 C422 604 424 628 426 650 Z" fill="var(--ls-trunk)" />
      <path d="M420 614 L441 592 M418 602 L401 585" stroke="var(--ls-trunk)" strokeWidth="5" strokeLinecap="round" fill="none" />
      <g fill="var(--ls-leaf-0)">
        <ellipse cx="420" cy="500" rx="46" ry="84" />
        <ellipse cx="384" cy="542" rx="30" ry="48" transform="rotate(-18 384 542)" />
        <ellipse cx="458" cy="540" rx="30" ry="48" transform="rotate(18 458 540)" />
      </g>
      <g fill="var(--ls-leaf-1)">
        <ellipse cx="420" cy="494" rx="32" ry="66" />
        <ellipse cx="392" cy="538" rx="18" ry="34" transform="rotate(-18 392 538)" />
        <ellipse cx="450" cy="536" rx="18" ry="34" transform="rotate(18 450 536)" />
      </g>
      <g fill="var(--ls-leaf-2)" opacity="0.9">
        <ellipse cx="428" cy="450" rx="9" ry="20" transform="rotate(14 428 450)" />
        <ellipse cx="404" cy="500" rx="8" ry="17" transform="rotate(-10 404 500)" />
        <ellipse cx="442" cy="520" rx="7" ry="15" transform="rotate(20 442 520)" />
      </g>
      <g fill="#FFC2D4">
        <circle cx="398" cy="470" r="4" />
        <circle cx="444" cy="486" r="4" />
        <circle cx="414" cy="540" r="3.5" />
      </g>
    </g>
  );
}

// The house, drawn in a 278x174 box with its base at y=174.
function House() {
  return (
    <g>
      <rect x="26" y="62" width="226" height="112" rx="6" fill="var(--ls-wall)" stroke="var(--ls-wall-stroke)" strokeWidth="2" />
      <rect x="26" y="150" width="226" height="24" fill="var(--ls-wall-band)" opacity="0.7" />
      <rect x="190" y="6" width="28" height="56" fill="var(--ls-chimney)" stroke="var(--ls-wall-stroke)" strokeWidth="2" />
      <path d="M0 68 L139 0 L278 68 Z" fill="url(#lsRoof)" stroke="var(--ls-roof-shade)" strokeWidth="2" strokeLinejoin="round" />
      <path d="M139 0 L278 68 H139 Z" fill="var(--ls-roof-shade)" opacity="0.18" />
      <path d="M139 50 C126 42 120 34 125 29 C130 25 137 28 139 33 C141 28 148 25 153 29 C158 34 152 42 139 50 Z" fill="#E0301A" />
      <path d="M64 174 V120 a26 26 0 0 1 52 0 V174 Z" fill="var(--ls-door)" stroke="var(--ls-door-stroke)" strokeWidth="2" />
      <circle cx="104" cy="140" r="3.5" fill="#FFE680" />
      {/* warm window */}
      <circle className={styles.glow} cx="196" cy="122" r="116" fill="url(#lsWindow)" />
      <circle className={styles.nightOnly} cx="196" cy="122" r="170" fill="url(#lsWindow)" opacity="0.75" />
      <rect x="158" y="92" width="76" height="62" rx="8" fill="#FFE680" stroke="var(--ls-frame)" strokeWidth="3" />
      <path d="M196 92 V154 M158 123 H234" stroke="var(--ls-frame)" strokeWidth="3" />
      <rect x="152" y="152" width="88" height="8" rx="4" fill="var(--ls-frame)" />
      {/* chimney smoke curling up */}
      {[0, 1.4, 2.8].map((d) => (
        <circle key={d} className={styles.smoke} style={{ '--delay': `${d}s` }} cx="204" cy="-8" r="10" fill="var(--ls-smoke)" />
      ))}
    </g>
  );
}

function PathToDoor() {
  return (
    <>
      <path d="M134 644 H186 C194 672 262 690 318 730 H206 C148 702 126 674 134 644 Z" fill="var(--ls-path-0)" />
      <path d="M150 664 q14 6 24 0 M172 690 q16 6 28 2 M204 712 q14 4 26 0" stroke="var(--ls-path-1)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  );
}

function Fireflies({ list }) {
  return (
    <g aria-hidden="true" pointerEvents="none">
      {list.map((f, i) => (
        <g
          key={i}
          className={styles.firefly}
          style={{ '--dx': `${f.dx}px`, '--dy': `${f.dy}px`, '--dur': `${f.dur}s`, '--delay': `${f.delay}s` }}
        >
          <circle cx={f.x} cy={f.y} r="7" fill="#FFF3A0" opacity="0.28" />
          <circle cx={f.x} cy={f.y} r="2.6" fill="#FFF3A0" />
        </g>
      ))}
    </g>
  );
}

// Night sky sprinkle; hidden by day (CSS) and held still with reduced motion.
function Stars({ list }) {
  return (
    <g className={styles.nightOnly} aria-hidden="true" pointerEvents="none">
      {list.map((st, i) => (
        <circle
          key={i}
          className={styles.twinkle}
          style={{ '--dur': `${st.dur}s`, '--delay': `${st.delay}s` }}
          cx={st.x}
          cy={st.y}
          r={st.r}
          fill="var(--ls-star)"
        />
      ))}
    </g>
  );
}

function Defs() {
  return (
    <defs>
      <linearGradient id="lsSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--ls-sky-0)" />
        <stop offset="0.45" stopColor="var(--ls-sky-1)" />
        <stop offset="0.75" stopColor="var(--ls-sky-2)" />
        <stop offset="1" stopColor="var(--ls-sky-3)" />
      </linearGradient>
      <radialGradient id="lsGlow">
        <stop offset="0" stopColor="var(--ls-glow-0)" stopOpacity="0.95" />
        <stop offset="0.5" stopColor="var(--ls-glow-1)" stopOpacity="0.35" />
        <stop offset="1" stopColor="var(--ls-glow-1)" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="lsSunLight">
        <stop offset="0" stopColor="#FFF1B0" stopOpacity="0.7" />
        <stop offset="1" stopColor="#FFF1B0" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="lsSunDisc" cx="0.4" cy="0.35" r="0.8">
        <stop offset="0" stopColor="var(--ls-sun-disc-0)" stopOpacity="0.9" />
        <stop offset="1" stopColor="var(--ls-sun-disc-1)" stopOpacity="0.25" />
      </radialGradient>
      <linearGradient id="lsCloud" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--ls-cloud-0)" />
        <stop offset="1" stopColor="var(--ls-cloud-1)" />
      </linearGradient>
      <linearGradient id="lsMtnFar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--ls-mtn-far-0)" />
        <stop offset="1" stopColor="var(--ls-mtn-far-1)" />
      </linearGradient>
      <linearGradient id="lsMtnNear" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--ls-mtn-near-0)" />
        <stop offset="1" stopColor="var(--ls-mtn-near-1)" />
      </linearGradient>
      <linearGradient id="lsHill1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--ls-hill1-0)" />
        <stop offset="1" stopColor="var(--ls-hill1-1)" />
      </linearGradient>
      <linearGradient id="lsHill2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--ls-hill2-0)" />
        <stop offset="1" stopColor="var(--ls-hill2-1)" />
      </linearGradient>
      <linearGradient id="lsMeadow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--ls-meadow-0)" />
        <stop offset="1" stopColor="var(--ls-meadow-1)" />
      </linearGradient>
      <linearGradient id="lsRoof" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--ls-roof-0)" />
        <stop offset="1" stopColor="var(--ls-roof-1)" />
      </linearGradient>
      <radialGradient id="lsWindow">
        <stop offset="0" stopColor="#FFE680" stopOpacity="0.95" />
        <stop offset="0.45" stopColor="#FFD366" stopOpacity="0.45" />
        <stop offset="1" stopColor="#FFD366" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

// ---------- characters ----------

const DOG_EARS = {
  floppy: (c) => <path d="M19 19 C9 19 7 33 12 40 C18 38 20 30 21 23 Z" fill={c} />,
  pointy: (c) => <path d="M19 20 L17 3 L31 14 Z" fill={c} />,
  round: (c) => <circle cx="18" cy="17" r="7" fill={c} />,
  long: (c) => <path d="M20 18 C7 20 4 42 12 52 C19 48 21 36 22 25 Z" fill={c} />,
  folded: (c) => (
    <>
      <path d="M19 21 L19 5 L27 8 L31 15 Z" fill={c} />
      <path d="M19 5 L24 11" />
    </>
  ),
};

function DogArt({ fur, belly, ear, earColor, collar, spot, bodyRx = 17 }) {
  return (
    <>
      <path className={styles.tail} d="M46 50 C55 48 59 40 55 33 C52 40 49 44 44 46 Z" fill={fur} />
      <ellipse cx="32" cy="50" rx={bodyRx} ry="11" fill={fur} />
      <ellipse cx="25" cy="60" rx="5" ry="3" fill={fur} />
      <ellipse cx="39" cy="60" rx="5" ry="3" fill={fur} />
      {DOG_EARS[ear](earColor)}
      <g transform="translate(64 0) scale(-1 1)">{DOG_EARS[ear](earColor)}</g>
      <circle cx="32" cy="28" r="15" fill={fur} />
      {spot ? <circle cx="39" cy="25" r="5.4" fill={spot} stroke="none" /> : null}
      <ellipse cx="32" cy="34" rx="8" ry="6" fill={belly} stroke="none" />
      <circle cx="25" cy="26" r="1.8" fill={INK} stroke="none" />
      <circle cx="39" cy="26" r="1.8" fill={INK} stroke="none" />
      <ellipse cx="32" cy="31.5" rx="2.8" ry="2" fill={INK} stroke="none" />
      <path d="M28.5 36 Q32 39.5 35.5 36" />
      <path d="M19 41 Q32 49 45 41" stroke={collar} strokeWidth="4.6" />
      <circle cx="32" cy="46.5" r="2.2" fill="#FFE680" strokeWidth="1.6" />
    </>
  );
}

// Five visibly different placeholder dogs (ears, fur, collar); real looks come later.
const DOGS = [
  { id: 'zizi', name: 'Zizi', art: { fur: '#F5D68C', belly: '#FFF3D6', ear: 'floppy', earColor: '#D99A4E', collar: '#E0301A' } },
  { id: 'loafie', name: 'Loafie', art: { fur: '#FFFDF5', belly: '#FFE9D2', ear: 'round', earColor: '#F2C9A0', collar: '#5CB3FF', bodyRx: 21 } },
  { id: 'zoey', name: 'Zoey', art: { fur: '#B9784A', belly: '#F0D2A8', ear: 'pointy', earColor: '#8A5530', collar: '#FF9F1C' } },
  { id: 'tato', name: 'Tato', art: { fur: '#454663', belly: '#D2A070', ear: 'long', earColor: '#2C2D45', collar: '#9DB0FF' } },
  { id: 'cooper', name: 'Cooper', art: { fur: '#B3BDD1', belly: '#FFFFFF', ear: 'folded', earColor: '#7F8AA3', collar: '#3FB8AF', spot: '#5E6985' } },
];

function RorryArt({ pink }) {
  return (
    <>
      <path d={RORRY_BODY} fill={pink ? '#FF8FB1' : '#3FB8AF'} />
      <path d="M22 18 C26 14 32 13 38 14" stroke="#fff" strokeWidth="2.4" opacity="0.6" />
      {pink ? (
        <>
          <path d="M21.5 32 Q25 27.5 28.5 32 M35.5 32 Q39 27.5 42.5 32" />
          <circle cx="20" cy="38" r="3" fill="#FF5F8F" stroke="none" opacity="0.55" />
          <circle cx="44" cy="38" r="3" fill="#FF5F8F" stroke="none" opacity="0.55" />
          <path d="M26 39.5 Q32 47 38 39.5" />
        </>
      ) : (
        <>
          <path d="M20 26 L29 29 M44 26 L35 29" />
          <circle cx="25" cy="33" r="1.8" fill={INK} stroke="none" />
          <circle cx="39" cy="33" r="1.8" fill={INK} stroke="none" />
          <path d="M26 43 Q32 38 38 43" />
        </>
      )}
    </>
  );
}

export default function LandingScene({ phone = false }) {
  const reduce = useReducedMotion();
  const L = phone ? PHONE : WIDE;
  const [active, setActive] = useState(null);
  const timer = useRef(null);

  const say = useCallback((id, ms = 2200) => {
    setActive(id);
    clearTimeout(timer.current);
    if (ms) timer.current = setTimeout(() => setActive(null), ms);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  // The wide scene is cropped top and bottom on very wide screens; keep the sun inside what shows.
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const cropTop = Math.max(0, 760 - (1200 * viewport.h) / viewport.w);
  const sunPos = { x: 1070, y: Math.max(150, cropTop + 85) };

  // ---- parallax: sky and hills drift with the mouse (mouse only: none on touch, none when reduced)
  const mouseX = useMotionValue(0);
  const smooth = useSpring(mouseX, { stiffness: 55, damping: 18 });
  useEffect(() => {
    if (reduce || phone) return undefined;
    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return;
      mouseX.set(e.clientX / window.innerWidth - 0.5);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [reduce, phone, mouseX]);

  const sunX = useShift(smooth, 10);
  const cloudsX = useShift(smooth, 28);
  const farX = useShift(smooth, 8);
  const midX = useShift(smooth, 16);
  const nearX = useShift(smooth, 26);
  const frontX = useShift(smooth, 38);

  // ---- Motmot: click to drive across the road and back
  const motmot = useAnimationControls();
  const [driving, setDriving] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const drive = async () => {
    if (driving) return;
    say('motmot', 1400);
    if (reduce) return;
    setDriving(true);
    await motmot.start({ x: L.motmot.travel, transition: { duration: phone ? 2.2 : 2.8, ease: 'easeInOut' } });
    setFacingLeft(true);
    await motmot.start({ x: 0, transition: { duration: phone ? 2.2 : 2.8, ease: 'easeInOut' } });
    setFacingLeft(false);
    setDriving(false);
  };

  // ---- Skyrie: tap for a big bounce that squashes on landing
  const skyrie = useAnimationControls();
  const bounce = () => {
    say('skyrie', 1400);
    if (reduce) return;
    const h = phone ? 100 : 150;
    skyrie.start({
      y: [0, -h, 0, -h * 0.43, 0, -h * 0.15, 0],
      scaleY: [1, 1.1, 0.68, 1.05, 0.84, 1.02, 1],
      scaleX: [1, 0.92, 1.26, 0.97, 1.12, 0.99, 1],
      transition: { duration: 1.6, times: [0, 0.3, 0.44, 0.62, 0.76, 0.9, 1], ease: 'easeOut' },
    });
  };

  // ---- Rorry: reversible octopus, click to flip teal grumpy <-> pink happy
  const rorry = useAnimationControls();
  const [pink, setPink] = useState(false);
  const [flipping, setFlipping] = useState(false);
  const flip = async () => {
    if (flipping) return;
    say('rorry', 2400);
    if (reduce) {
      setPink((p) => !p);
      return;
    }
    setFlipping(true);
    await rorry.start({ scaleX: 0, y: -16, transition: { duration: 0.17, ease: 'easeIn' } });
    setPink((p) => !p);
    await rorry.start({ scaleX: 1, y: 0, transition: { duration: 0.24, ease: 'easeOut' } });
    setFlipping(false);
  };

  const onKeyActivate = (fn) => (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn();
    }
  };

  // Hover / focus show the bubble for as long as they last; a tap shows it for a moment.
  const hoverProps = (id) => ({
    onPointerEnter: (e) => e.pointerType === 'mouse' && setActive(id),
    onPointerLeave: (e) => e.pointerType === 'mouse' && setActive((prev) => (prev === id ? null : prev)),
    onFocus: () => setActive(id),
    onBlur: () => setActive((prev) => (prev === id ? null : prev)),
    onClick: () => say(id),
    onKeyDown: onKeyActivate(() => say(id)),
  });

  // A hit area a little bigger than the drawing, so a thumb can't miss.
  const hit = (c) => <rect x={c.x - 4} y={c.y - 4} width={c.size + 8} height={c.size + 8} fill="transparent" />;
  const bubbleY = (c) => c.y - 56;
  const bubbleX = (c) => c.x + c.size / 2;

  const characters = (
    <>
      {/* Junebug (avocado) */}
      <g className={styles.character} data-active={active === 'junebug'} role="button" tabIndex={0} aria-label="Junebug, an avocado plushie: say hi" {...hoverProps('junebug')}>
        {hit(L.junebug)}
        <g className={styles.wiggle}>
          <Glyph name="plush" x={L.junebug.x} y={L.junebug.y} size={L.junebug.size} />
        </g>
      </g>

      {/* Chimken (long avocado) */}
      <g className={styles.character} data-active={active === 'chimken'} role="button" tabIndex={0} aria-label="Chimken, a long avocado plushie: say hi" {...hoverProps('chimken')}>
        {hit(L.chimken)}
        <g className={styles.wiggle}>
          <Glyph name="chimken" x={L.chimken.x} y={L.chimken.y} size={L.chimken.size} />
        </g>
      </g>

      {/* Rorry (reversible octopus) */}
      <g
        className={styles.character}
        data-active={active === 'rorry'}
        role="button"
        tabIndex={0}
        aria-label={`Rorry, a reversible octopus plushie, showing the ${pink ? 'pink happy' : 'teal grumpy'} side: tap to flip`}
        {...hoverProps('rorry')}
        onClick={flip}
        onKeyDown={onKeyActivate(flip)}
      >
        {hit(L.rorry)}
        <motion.g animate={rorry} style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}>
          <g className={styles.wiggle}>
            <Glyph x={L.rorry.x} y={L.rorry.y} size={L.rorry.size}>
              <RorryArt pink={pink} />
            </Glyph>
          </g>
        </motion.g>
      </g>

      {/* dogs */}
      {DOGS.map((d, i) => {
        const c = { x: L.dogs.xs[i], size: L.dogs.sizes[i], y: L.dogs.y - L.dogs.sizes[i] };
        return (
          <g key={d.id} className={styles.character} data-active={active === d.id} role="button" tabIndex={0} aria-label={`${d.name}, a good dog: say hi`} {...hoverProps(d.id)}>
            {hit(c)}
            <g className={styles.wiggle}>
              <Glyph x={c.x} y={c.y} size={c.size}>
                <DogArt {...d.art} />
              </Glyph>
            </g>
          </g>
        );
      })}

      {/* Skyrie */}
      <g
        className={styles.character}
        data-active={active === 'skyrie'}
        role="button"
        tabIndex={0}
        aria-label="Skyrie, a fluffy bear plushie in a rainbow beanie: tap to bounce"
        onClick={bounce}
        onKeyDown={onKeyActivate(bounce)}
        onFocus={() => setActive('skyrie')}
        onBlur={() => setActive((prev) => (prev === 'skyrie' ? null : prev))}
      >
        {hit(L.skyrie)}
        <motion.g animate={skyrie} style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}>
          <g className={styles.squish}>
            <Glyph name="ball" x={L.skyrie.x} y={L.skyrie.y} size={L.skyrie.size} />
          </g>
        </motion.g>
      </g>

      {/* Motmot */}
      <motion.g
        animate={motmot}
        className={styles.character}
        data-active={active === 'motmot'}
        role="button"
        tabIndex={0}
        aria-label="Motmot, the scooter parked out front: tap to drive across the road and back"
        onClick={drive}
        onKeyDown={onKeyActivate(drive)}
        onFocus={() => setActive('motmot')}
        onBlur={() => setActive((prev) => (prev === 'motmot' ? null : prev))}
      >
        {hit(L.motmot)}
        <g className={driving ? styles.bob : undefined}>
          <g transform={facingLeft ? `translate(${2 * (L.motmot.x + L.motmot.size / 2)} 0) scale(-1 1)` : undefined}>
            <Glyph name="motmot" x={L.motmot.x} y={L.motmot.y} size={L.motmot.size} />
          </g>
        </g>
        <Bubble cx={bubbleX(L.motmot)} y={bubbleY(L.motmot)} text="vroom vroom!" show={active === 'motmot'} bounds={L.bounds} />
      </motion.g>
    </>
  );

  // Name bubbles are drawn in a second svg layered above the storybook (z-index), so a book or a
  // neighbouring character can never cover them. It uses the scene's viewBox so they line up.
  const bubbles = (
    <g pointerEvents="none">
          {[
            { id: 'junebug', c: L.junebug, text: 'Junebug' },
            { id: 'chimken', c: L.chimken, text: 'Chimken' },
            { id: 'rorry', c: L.rorry, text: pink ? 'yay!' : 'hmph.' },
            ...DOGS.map((d, i) => ({ id: d.id, c: { x: L.dogs.xs[i], size: L.dogs.sizes[i], y: L.dogs.y - L.dogs.sizes[i] }, text: d.name })),
            { id: 'skyrie', c: L.skyrie, text: 'boing!' },
          ].map((b) => (
            <Bubble key={b.id} cx={bubbleX(b.c)} y={bubbleY(b.c)} text={b.text} show={active === b.id} bounds={L.bounds} />
          ))}
        </g>
  );

  const label = 'A cozy little scene: our house with a glowing window, Motmot parked out front, five dogs and four plushies';

  if (phone) {
    return (
      <>
        {/* sun and clouds in a strip at the top, below the status bar, clear of the title */}
        <svg className={styles.phoneSky} viewBox="0 0 400 200" preserveAspectRatio="xMidYMin meet" aria-hidden="true">
          <Sun x={338} y={62} />
          <Cloud x={262} y={72} scale={0.52} duration={30} />
        </svg>

        <svg className={styles.scene} viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" role="group" aria-label={label}>
          <Defs />

          <g aria-hidden="true">
            <Stars list={STARS_PHONE} />
            <Cloud x={20} y={392} scale={0.42} duration={34} delay={-8} opacity={0.85} />
            <path
              d="M-40 520 L20 470 L70 495 L130 440 L190 490 L240 460 L300 505 L350 455 L440 510 V620 H-40 Z"
              fill="url(#lsMtnFar)"
            />
            <path d="M-40 548 L40 506 L110 536 L180 492 L250 540 L320 506 L440 548 V620 H-40 Z" fill="url(#lsMtnNear)" opacity="0.9" />
            <rect x="-40" y="500" width="480" height="110" fill="var(--ls-haze)" opacity="0.4" />
            <path d="M-40 566 C60 522 160 524 230 558 C300 592 360 542 440 550 V650 H-40 Z" fill="url(#lsHill1)" />
            <path d="M-40 594 C80 566 180 570 250 590 C320 610 380 582 440 588 V690 H-40 Z" fill="url(#lsHill2)" />
            <path d="M-40 604 C100 592 250 608 440 596 V830 H-40 Z" fill="url(#lsMeadow)" />
            <path d={TUFT_PATH_PHONE} stroke="var(--ls-tuft)" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.55" />

            <g transform="translate(61 201) scale(0.62)">
              <Tree />
            </g>
            <g transform="translate(14 455) scale(0.86)">
              <House />
            </g>
            <g transform="translate(91 604) scale(0.86) translate(-160 -644)">
              <PathToDoor />
            </g>
            {WILDFLOWERS_PHONE.map((f) => (
              <Wild key={`${f.x}-${f.y}`} {...f} />
            ))}

            <rect x="-40" y="752" width="480" height="60" fill="var(--ls-road)" />
            <path d="M-40 752 H440" stroke="var(--ls-path-1)" strokeWidth="3" />
            <path d="M-40 780 H440" stroke="var(--ls-road-dash)" strokeWidth="4" strokeDasharray="22 18" opacity="0.9" />
          </g>

          <Fireflies list={FIREFLIES_PHONE} />
          {characters}
        </svg>
        <svg className={styles.bubbleLayer} viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
          {bubbles}
        </svg>
      </>
    );
  }

  return (
    <>
    <svg className={styles.scene} viewBox="0 0 1200 760" preserveAspectRatio="xMidYMax slice" role="group" aria-label={label}>
      <Defs />

      {/* sky, with warm light around the sun */}
      <rect x="-600" y="-500" width="2400" height="1500" fill="url(#lsSky)" />
      <Stars list={STARS} />
      <circle cx={sunPos.x} cy={sunPos.y} r="320" fill="url(#lsSunLight)" aria-hidden="true" />

      <motion.g style={{ x: sunX }}>
        <Sun x={sunPos.x} y={sunPos.y} />
      </motion.g>

      <motion.g style={{ x: cloudsX }} aria-hidden="true">
        <Cloud x={-20} y={50} scale={1.15} duration={40} />
        <Cloud x={380} y={110} scale={0.85} duration={34} delay={-10} opacity={0.9} />
        <Cloud x={720} y={36} scale={1} duration={44} delay={-20} />
        <Cloud x={960} y={112} scale={0.95} duration={36} delay={-6} />
      </motion.g>

      {/* distant mountains, fading into haze */}
      <motion.g style={{ x: farX }} aria-hidden="true">
        <path
          d="M-100 540 L40 452 L130 498 L250 396 L370 488 L470 436 L590 520 L700 410 L830 508 L930 428 L1060 500 L1170 446 L1300 520 V640 H-100 Z"
          fill="url(#lsMtnFar)"
          strokeLinejoin="round"
        />
        <path
          d="M-100 570 L60 500 L190 548 L320 470 L450 556 L560 500 L690 570 L820 486 L950 560 L1080 506 L1300 570 V640 H-100 Z"
          fill="url(#lsMtnNear)"
          opacity="0.9"
          strokeLinejoin="round"
        />
        <rect x="-100" y="540" width="1400" height="110" fill="var(--ls-haze)" opacity="0.4" />
      </motion.g>

      {/* rolling hills */}
      <motion.g style={{ x: midX }} aria-hidden="true">
        <path d="M-100 590 C60 540 250 530 420 580 C560 620 680 540 860 536 C1020 532 1140 576 1300 548 V700 H-100 Z" fill="url(#lsHill1)" />
        <path d="M-100 628 C100 580 300 584 470 624 C620 658 780 586 950 592 C1090 598 1190 626 1300 606 V720 H-100 Z" fill="url(#lsHill2)" />
      </motion.g>

      <motion.g style={{ x: nearX }}>
        <g aria-hidden="true">
          <path d="M-100 648 C200 624 420 646 640 638 C860 630 1040 652 1300 634 V780 H-100 Z" fill="url(#lsMeadow)" />
          <path d={TUFT_PATH} stroke="var(--ls-tuft)" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55" />
          <Tree />
          <g transform="translate(432 78) scale(0.88)">
            <TreeB />
          </g>
          <g transform="translate(70 470)">
            <House />
          </g>
          <PathToDoor />
          {[
            { x: 108, c: '#FF8FB1' },
            { x: 224, c: '#FFFFFF' },
            { x: 244, c: '#FFE680' },
            { x: 276, c: '#FF8FB1' },
          ].map((f) => (
            <Wild key={f.x} x={f.x} y={632} c={f.c} />
          ))}
          {WILDFLOWERS.map((f) => (
            <Wild key={`${f.x}-${f.y}`} {...f} />
          ))}
        </g>
      </motion.g>

      {/* fireflies and floating petals */}
      <Fireflies list={FIREFLIES} />
      <g aria-hidden="true" pointerEvents="none">
        {PETALS.map((p, i) => (
          <g key={i} className={styles.petal} style={{ '--dur': `${p.dur}s`, '--delay': `${p.delay}s` }}>
            <ellipse cx={p.x} cy={p.y} rx="5" ry="2.8" fill={p.color} opacity="0.85" />
          </g>
        ))}
      </g>

      <motion.g style={{ x: frontX }}>
        {/* the road Motmot parks on */}
        <g aria-hidden="true">
          <rect x="-100" y="728" width="1400" height="50" fill="var(--ls-road)" />
          <path d="M-100 728 H1300" stroke="var(--ls-path-1)" strokeWidth="3" />
          <path d="M-100 752 H1300" stroke="var(--ls-road-dash)" strokeWidth="4" strokeDasharray="26 22" opacity="0.9" />
        </g>
        {characters}
      </motion.g>
    </svg>
    <svg className={styles.bubbleLayer} viewBox="0 0 1200 760" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <motion.g style={{ x: frontX }}>{bubbles}</motion.g>
    </svg>
    </>
  );
}
