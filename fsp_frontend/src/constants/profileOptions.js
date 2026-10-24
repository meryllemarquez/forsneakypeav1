// Keys here must match ALLOWED_ACCENT_COLORS in ProfileService.java exactly. Only the colours and
// labels are ours: the choice colours your avatar ring and your highlighted tab (`ink` is the text
// colour that stays readable on that colour).
export const ACCENT_COLORS = [
  { key: 'soft-pink', label: 'Peach', hex: '#FFD8A0', ink: '#172B70' },
  { key: 'rose', label: 'Citrus', hex: '#FF9F1C', ink: '#172B70' },
  { key: 'lavender', label: 'Periwinkle', hex: '#CBDBF8', ink: '#172B70' },
  { key: 'cream', label: 'Gelato', hex: '#FFE680', ink: '#172B70' },
  { key: 'sky-blue', label: 'Sea', hex: '#5CB3FF', ink: '#172B70' },
  { key: 'sage-green', label: 'Amalfi', hex: '#1F55C9', ink: '#FFFFFF' },
];

export const DEFAULT_ACCENT_COLOR = 'rose';

export function getAccent(key) {
  return ACCENT_COLORS.find((c) => c.key === key) || ACCENT_COLORS.find((c) => c.key === DEFAULT_ACCENT_COLOR);
}

export function getAccentHex(key) {
  return getAccent(key).hex;
}

export const EMOJI_OPTIONS = ['❤️', '🌸', '🐻', '✨', '🫶', '🌙', '💕', '🧸'];

export const NICKNAME_SUGGESTIONS = ['Baby', 'Honey', 'Love', 'Mahal', 'Bub', 'My Person'];
