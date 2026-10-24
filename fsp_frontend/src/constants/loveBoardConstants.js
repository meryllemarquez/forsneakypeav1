import { Heart, History, PartyPopper, CloudRain, HandHeart, Moon } from 'lucide-react';

// Handwriting fonts a note's content can be rendered in. `family` is the
// literal CSS font-family string persisted on the note (font_family column).
export const HANDWRITING_FONTS = [
  { key: 'patrick', label: 'Patrick Hand', family: '"Patrick Hand", cursive' },
  { key: 'caveat', label: 'Caveat', family: '"Caveat", cursive' },
  { key: 'kalam', label: 'Kalam', family: '"Kalam", cursive' },
  { key: 'indie', label: 'Indie Flower', family: '"Indie Flower", cursive' },
  { key: 'gloria', label: 'Gloria Hallelujah', family: '"Gloria Hallelujah", cursive' },
  { key: 'architects', label: 'Architects Daughter', family: '"Architects Daughter", cursive' },
];

// Clean/plain fonts, offered alongside the handwriting set so a note's
// content can go either romantic-scrawl or crisp-modern.
export const PLAIN_FONTS = [
  { key: 'inter', label: 'Inter', family: '"Inter", sans-serif' },
  { key: 'poppins', label: 'Poppins', family: '"Poppins", sans-serif' },
  { key: 'nunito', label: 'Nunito', family: '"Nunito", sans-serif' },
  { key: 'quicksand', label: 'Quicksand', family: '"Quicksand", sans-serif' },
  { key: 'outfit', label: 'Outfit', family: '"Outfit", sans-serif' },
  { key: 'manrope', label: 'Manrope', family: '"Manrope", sans-serif' },
];

// Grouped view used by FontPicker so users can switch between handwritten
// and plain styles per text box/note.
export const NOTE_FONT_GROUPS = [
  { group: 'Handwritten', options: HANDWRITING_FONTS },
  { group: 'Plain', options: PLAIN_FONTS },
];

export const DEFAULT_FONT_FAMILY = HANDWRITING_FONTS[0].family;

// Must match entity.NoteMood on the backend (LOVING, NOSTALGIC, PLAYFUL,
// MISSING_YOU, GRATEFUL, SLEEPY). `icon` is a Lucide component reference
// (interface chrome must not use emoji).
export const MOOD_OPTIONS = [
  { value: 'LOVING', icon: Heart, label: 'Loving' },
  { value: 'NOSTALGIC', icon: History, label: 'Nostalgic' },
  { value: 'PLAYFUL', icon: PartyPopper, label: 'Playful' },
  { value: 'MISSING_YOU', icon: CloudRain, label: 'Missing You' },
  { value: 'GRATEFUL', icon: HandHeart, label: 'Grateful' },
  { value: 'SLEEPY', icon: Moon, label: 'Sleepy' },
];

export const ATTACHMENT_TYPES = {
  PIN: 'PIN',
  TAPE: 'TAPE',
  NONE: 'NONE',
};

export const FONT_COLOR_SWATCHES = ['#2b2b2b', '#172B70', '#1F55C9', '#E0301A', '#1f4d3d', '#6b3f6b'];

// The board is a large scrollable canvas — notes/stickers get a randomized
// spot within it so nothing is ever perfectly aligned.
export const BOARD_WIDTH = 2400;
export const BOARD_HEIGHT = 1600;

export function randomBoardPosition() {
  return {
    x: 120 + Math.random() * (BOARD_WIDTH - 360),
    y: 120 + Math.random() * (BOARD_HEIGHT - 360),
  };
}

export function randomNoteRotation() {
  const sign = Math.random() < 0.5 ? -1 : 1;
  return sign * (2 + Math.random() * 7); // ~2deg - 9deg
}

export function randomStickerRotation() {
  const sign = Math.random() < 0.5 ? -1 : 1;
  return sign * Math.random() * 25;
}
