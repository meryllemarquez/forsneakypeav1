// The Love Board's papers, pins, tapes and stickers are drawn in CSS and the doodle icon kit
// (no images). Letters and stickers store plain strings in their existing text columns:
//   paper:<name>   pin:<color>   tape:<color>   icon:<name>
// Letters saved before the rebrand stored image file names; the maps below turn those into the
// closest new look, so old letters keep rendering with no data migration.

// Where each paper sits inside the 280x320 note canvas (percent). These match the visible area of
// the old paper images, so text boxes placed on old letters still land on the paper.
export const PAPERS = [
  { id: 'gelato', label: 'Gelato sticky', rect: { left: 10.2, top: 21.4, width: 73.9, height: 61.9 } },
  { id: 'sea', label: 'Sea sticky', rect: { left: 12.6, top: 18.1, width: 73.8, height: 55.9 } },
  { id: 'citrus', label: 'Citrus sticky', rect: { left: 10.6, top: 18.7, width: 77.2, height: 61.3 } },
  { id: 'lined', label: 'Lined card', rect: { left: 4.1, top: 26.4, width: 90.5, height: 43.6 } },
  { id: 'grid', label: 'Grid card', rect: { left: 10, top: 20, width: 78, height: 60 } },
  { id: 'torn', label: 'Torn page', rect: { left: 12.3, top: 24.7, width: 76.7, height: 49.9 } },
];

export const PIN_COLORS = [
  { id: 'tomato', label: 'Tomato' },
  { id: 'citrus', label: 'Citrus' },
  { id: 'gelato', label: 'Gelato' },
  { id: 'sea', label: 'Sea' },
  { id: 'amalfi', label: 'Amalfi' },
  { id: 'ink', label: 'Ink' },
];

export const TAPE_COLORS = [
  { id: 'sea', label: 'Sea' },
  { id: 'gelato', label: 'Gelato' },
  { id: 'citrus', label: 'Citrus' },
  { id: 'tomato', label: 'Tomato' },
  { id: 'amalfi', label: 'Amalfi' },
];

// Sticker tabs, as in the icon kit guide (Icons.dc.html). Every doodle appears once.
export const STICKER_GROUPS = [
  { id: 'starshine', label: 'Starshine', icons: ['her', 'star', 'film', 'videocam', 'tulip', 'daisy', 'mic', 'vinyl', 'cassette', 'dog', 'matcha'] },
  { id: 'junebug', label: 'Junebug', icons: ['him', 'car', 'rc', 'camera', 'motmot', 'wheel', 'jorts', 'meme', 'tree', 'cookie'] },
  { id: 'us', label: 'Us', icons: ['plane', 'utensils', 'pin', 'mountain', 'sun', 'museum', 'ticket', 'bed', 'arena', 'claw', 'ferris', 'ball', 'plush', 'chimken', 'rorry', 'lechon', 'bowl', 'yogurt', 'fries', 'churro', 'lasagna', 'pizza', 'donut'] },
  { id: 'app', label: 'App', icons: ['house', 'envelope', 'bell', 'heart', 'sparkle'] },
];

// A sticker that pins a saved bouquet: `bouquet:<uuid>` (the picture is drawn from the bouquet's recipe).
export const bouquetStickerValue = (id) => `bouquet:${id}`;
export const isBouquetSticker = (image) => typeof image === 'string' && image.startsWith('bouquet:');
export const bouquetStickerId = (image) => (isBouquetSticker(image) ? image.slice('bouquet:'.length) : null);

export const paperValue = (id) => `paper:${id}`;
export const pinValue = (id) => `pin:${id}`;
export const tapeValue = (id) => `tape:${id}`;
export const stickerValue = (name) => `icon:${name}`;

const LEGACY_PAPERS = {
  'sticky-yellow.png': 'gelato',
  'sticky-orange.png': 'citrus',
  'sticky-green.png': 'sea',
  'sticky-torn-1.png': 'lined',
  'sticky-torn-2.png': 'torn',
};

// The kit has no purple or pink, so those map to the nearest palette colour.
const LEGACY_PINS = {
  'red-pin.png': 'tomato',
  'orange-pin.png': 'citrus',
  'yellow-pin.png': 'gelato',
  'blue-pin.png': 'sea',
  'purple-pin.png': 'amalfi',
  'pink-pin.png': 'tomato',
};

const LEGACY_TAPES = {
  'red-tape.png': 'tomato',
  'yellow-tape.png': 'gelato',
  'green-tape.png': 'sea',
  'pink-tape.png': 'tomato',
  'brown-tape.png': 'citrus',
};

const LEGACY_STICKERS = {
  'heart-patch.png': 'heart',
  'star-patch.png': 'star',
  'daisy-patch.png': 'daisy',
  'camera-patch.png': 'camera',
  'sparkle-patch.png': 'sparkle',
  'flower-patch.png': 'tulip',
  'paw-patch.png': 'dog',
  'music-patch.png': 'vinyl',
  'ice-cream-patch.png': 'yogurt',
  'clover-patch.png': 'tree',
};

function resolve(value, prefix, legacy, valid, fallback) {
  if (typeof value === 'string') {
    if (value.startsWith(prefix)) {
      const id = value.slice(prefix.length);
      if (valid.includes(id)) return id;
    } else if (legacy[value]) {
      return legacy[value];
    }
  }
  return fallback;
}

const ALL_ICONS = STICKER_GROUPS.flatMap((g) => g.icons);

export const resolvePaperId = (value) => resolve(value, 'paper:', LEGACY_PAPERS, PAPERS.map((p) => p.id), 'gelato');
export const resolvePinColor = (value) => resolve(value, 'pin:', LEGACY_PINS, PIN_COLORS.map((c) => c.id), 'tomato');
export const resolveTapeColor = (value) => resolve(value, 'tape:', LEGACY_TAPES, TAPE_COLORS.map((c) => c.id), 'sea');
export const resolveStickerIcon = (value) => resolve(value, 'icon:', LEGACY_STICKERS, ALL_ICONS, 'sparkle');

export const paperLabel = (value) => PAPERS.find((p) => p.id === resolvePaperId(value))?.label || 'Paper';
export const stickerLabel = (value) => {
  const name = resolveStickerIcon(value);
  return name.charAt(0).toUpperCase() + name.slice(1);
};
