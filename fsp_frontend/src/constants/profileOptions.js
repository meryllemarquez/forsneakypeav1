// Keys here must match ALLOWED_ACCENT_COLORS in ProfileService.java exactly.
export const ACCENT_COLORS = [
  { key: 'soft-pink', label: 'Soft Pink', hex: '#F3C6D3' },
  { key: 'rose', label: 'Rose', hex: '#C73616' },
  { key: 'lavender', label: 'Lavender', hex: '#B9A6DB' },
  { key: 'cream', label: 'Cream', hex: '#E8D7BC' },
  { key: 'sky-blue', label: 'Sky Blue', hex: '#8FC1E3' },
  { key: 'sage-green', label: 'Sage Green', hex: '#A3B18A' },
];

export const DEFAULT_ACCENT_COLOR = 'rose';

export function getAccentHex(key) {
  return ACCENT_COLORS.find((c) => c.key === key)?.hex || ACCENT_COLORS[1].hex;
}

export const EMOJI_OPTIONS = ['❤️', '🌸', '🐻', '✨', '🫶', '🌙', '💕', '🧸'];

export const NICKNAME_SUGGESTIONS = ['Baby', 'Honey', 'Love', 'Mahal', 'Bub', 'My Person'];
