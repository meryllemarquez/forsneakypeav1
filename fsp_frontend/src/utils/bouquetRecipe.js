// The bouquet "recipe": the small JSON the backend stores (see docs/roadmap/06-bouquet-maker.md).
// Items array order is the z-order. The renderer ignores unknown fields and drops unknown flowers,
// so adding flowers later stays backwards compatible.

export const CANVAS = { w: 400, h: 500 };
export const GATHER = { x: 200, y: 340 };
export const LIMITS = { maxFlowers: 40, minScale: 0.4, maxScale: 2.5, history: 50 };

// Colours a flower can be tinted with (palette hex; no tomato).
export const TINT_HEX = {
  pink: '#FF8FB1',
  white: '#FFFFFF',
  citrus: '#FF9F1C',
  gelato: '#FFE680',
  'sea-tint': '#CDE7FF',
  'gelato-tint': '#FFF0B3',
  'citrus-tint': '#FFD8A0',
  'amalfi-tint': '#CBDBF8',
  green: '#5E9B4E',
};

export const TINT_NAMES = {
  pink: 'Pink',
  white: 'White',
  citrus: 'Citrus',
  gelato: 'Gelato',
  'sea-tint': 'Sky',
  'gelato-tint': 'Butter',
  'citrus-tint': 'Peach',
  'amalfi-tint': 'Periwinkle',
  green: 'Green',
};

// `from` is the main fill in the glyph that a tint replaces. Greenery has a single fixed colour
// and no stem of its own (`stem: false` flowers get one drawn to the gather point).
export const FLOWERS = [
  { name: 'tulip', label: 'Tulip', from: '#E0301A', tints: ['citrus', 'sea-tint', 'white', 'pink'], stem: true },
  { name: 'daisy', label: 'Daisy', from: '#FFFFFF', tints: ['white', 'gelato-tint', 'sea-tint'], stem: true },
  { name: 'rose', label: 'Rose', from: '#FF8FB1', tints: ['pink', 'gelato', 'white'], stem: true },
  { name: 'sunflower', label: 'Sunflower', from: '#FFE680', tints: ['gelato', 'citrus'], stem: true },
  { name: 'babysbreath', label: "Baby's breath", from: '#FFFFFF', tints: ['white', 'sea-tint'], stem: true },
  { name: 'lily', label: 'Lily', from: '#FFF0B3', tints: ['gelato-tint', 'white', 'pink'], stem: true },
  { name: 'leaf', label: 'Leaf', from: null, tints: ['green'], stem: false },
  { name: 'fern', label: 'Fern', from: null, tints: ['green'], stem: false },
  { name: 'eucalyptus', label: 'Eucalyptus', from: null, tints: ['green'], stem: false },
];

export const FLOWER_BY_NAME = Object.fromEntries(FLOWERS.map((f) => [f.name, f]));

// The letter card: a draggable 120 x 150 item tucked bottom-right, plus the text in `recipe.card`.
export const CARD_SIZE = { w: 120, h: 150 };
export const LETTER_MAX = 240;
export const NAME_MAX = 24;
export const CARD_PAPERS = [
  { id: 'gelato', label: 'Gelato', fill: '#FFF0B3' },
  { id: 'sea', label: 'Sea', fill: '#CDE7FF' },
  { id: 'citrus', label: 'Citrus', fill: '#FFD8A0' },
  { id: 'lined', label: 'Lined', fill: '#FFFFFF' },
];
export const PAPER_FILL = Object.fromEntries(CARD_PAPERS.map((p) => [p.id, p.fill]));
export const makeCardItem = (paper = 'gelato') => ({ id: 'card', type: 'card', x: 300, y: 390, r: 8, s: 1, paper });
export const findCard = (recipe) => recipe.items.find((item) => item.type === 'card') || null;

// Greedy word wrap (long words are cut), at most `maxLines` lines; the last line gets an ellipsis if cut.
export function wrapLines(text, maxChars, maxLines = Infinity) {
  const lines = [];
  let line = '';
  const push = () => {
    lines.push(line);
    line = '';
  };
  String(text || '')
    .split(/\s+/)
    .filter(Boolean)
    .forEach((rawWord) => {
      let word = rawWord;
      while (word.length > maxChars) {
        if (line) push();
        line = word.slice(0, maxChars);
        word = word.slice(maxChars);
        push();
      }
      if (!line) line = word;
      else if (line.length + 1 + word.length <= maxChars) line += ` ${word}`;
      else {
        push();
        line = word;
      }
    });
  if (line) push();
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1].slice(0, Math.max(0, maxChars - 1))}…`;
    return kept;
  }
  return lines;
}

export const emptyRecipe = () => ({
  v: 1,
  wrap: 'kraft',
  ribbon: { style: 'bow', color: 'sea' },
  items: [makeCardItem()],
  card: { show: true, to: '', from: '', text: '' },
});

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const round1 = (value) => Math.round(value * 10) / 10;
export const newItemId = () => `i${Math.random().toString(36).slice(2, 10)}`;

export const wrapAngle = (deg) => {
  const wrapped = ((((deg + 180) % 360) + 360) % 360) - 180;
  return wrapped === -180 ? 180 : wrapped;
};

export const flowerItems = (recipe) => recipe.items.filter((item) => item.type === 'flower');
export const flowerCount = (recipe) => flowerItems(recipe).length;

// Loaded recipes are cleaned so one odd item never breaks the editor: unknown flowers are dropped,
// numbers are clamped into the canvas.
export function normalizeRecipe(raw) {
  const base = emptyRecipe();
  if (!raw || typeof raw !== 'object') return base;
  const items = (Array.isArray(raw.items) ? raw.items : [])
    .filter((item) => item && item.type === 'flower' && FLOWER_BY_NAME[item.name])
    .map((item) => {
      const def = FLOWER_BY_NAME[item.name];
      return {
        id: String(item.id || newItemId()).slice(0, 16),
        type: 'flower',
        name: item.name,
        tint: def.tints.includes(item.tint) ? item.tint : def.tints[0],
        x: clamp(Number(item.x) || 0, 0, CANVAS.w),
        y: clamp(Number(item.y) || 0, 0, CANVAS.h),
        r: clamp(Number(item.r) || 0, -180, 180),
        s: clamp(Number(item.s) || 1, LIMITS.minScale, LIMITS.maxScale),
        flip: Boolean(item.flip),
      };
    });
  const showCard = raw.card?.show !== false;
  const savedCard = (Array.isArray(raw.items) ? raw.items : []).find((item) => item && item.type === 'card');
  const cardItems =
    showCard && savedCard
      ? [
          {
            ...makeCardItem(PAPER_FILL[savedCard.paper] ? savedCard.paper : 'gelato'),
            x: clamp(Number(savedCard.x) || 300, 0, CANVAS.w),
            y: clamp(Number(savedCard.y) || 390, 0, CANVAS.h),
            r: clamp(Number(savedCard.r) || 0, -180, 180),
            s: clamp(Number(savedCard.s) || 1, LIMITS.minScale, LIMITS.maxScale),
          },
        ]
      : [];
  return {
    ...base,
    wrap: typeof raw.wrap === 'string' ? raw.wrap : base.wrap,
    ribbon: {
      style: raw.ribbon?.style || base.ribbon.style,
      color: raw.ribbon?.color || base.ribbon.color,
    },
    items: [...items, ...cardItems],
    card: { ...base.card, ...(raw.card && typeof raw.card === 'object' ? raw.card : {}), show: showCard && cardItems.length > 0 },
  };
}

// Where the next flower lands: fanned out from the gather point, alternating sides.
export function fanPlacement(index, greenery = false) {
  const side = index % 2 === 0 ? -1 : 1;
  const angle = side * (6 + ((index * 11) % 30)); // -36..36 degrees
  const reach = greenery ? 105 : 140 + (index % 3) * 12;
  const rad = (angle * Math.PI) / 180;
  return {
    x: round1(clamp(GATHER.x + Math.sin(rad) * reach, 0, CANVAS.w)),
    y: round1(clamp(GATHER.y - Math.cos(rad) * reach, 0, CANVAS.h)),
    r: Math.round(angle * 0.8),
  };
}

export function describeRecipe(recipe) {
  const counts = {};
  flowerItems(recipe).forEach((item) => {
    const label = FLOWER_BY_NAME[item.name]?.label.toLowerCase() || item.name;
    counts[label] = (counts[label] || 0) + 1;
  });
  const parts = Object.entries(counts).map(([label, n]) => `${n} ${label}`);
  const what = parts.length ? parts.join(', ') : 'No flowers yet';
  return `Bouquet: ${what}, ${recipe.ribbon.color} ${recipe.ribbon.style === 'none' ? 'no ribbon' : recipe.ribbon.style}, ${recipe.wrap} paper`;
}
