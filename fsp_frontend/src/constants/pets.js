// The nine little ones: single source for names, kinds and which drawing each one uses.
// Looks live in components/pets/PetCharacter/petArt.jsx (dogs reuse the landing scene's drawings;
// plushies use the icon kit). TODO: swap `icon` for per-dog drawings if they are added to the kit.
export const PETS = [
  { id: 'zizi', name: 'Zizi', kind: 'dog', icon: 'dog' },
  { id: 'loafie', name: 'Loafie', kind: 'dog', icon: 'dog' },
  { id: 'zoey', name: 'Zoey', kind: 'dog', icon: 'dog' },
  { id: 'tato', name: 'Tato', kind: 'dog', icon: 'dog' },
  { id: 'cooper', name: 'Cooper', kind: 'dog', icon: 'dog' },
  { id: 'junebug', name: 'Junebug', kind: 'plush', icon: 'plush' },
  { id: 'chimken', name: 'Chimken', kind: 'plush', icon: 'chimken' },
  { id: 'rorry', name: 'Rorry', kind: 'plush', icon: 'rorry' },
  { id: 'skyrie', name: 'Skyrie', kind: 'plush', icon: 'ball' },
];

export const PET_BY_ID = Object.fromEntries(PETS.map((p) => [p.id, p]));

// What a character can look like. Never anything alarming: "hungry" is a small thought bubble.
export const FACE_MOODS = ['happy', 'sleepy', 'hungry', 'playful'];

// Server mood (GET /pets) -> face. A pet who would like a cuddle just looks content.
export const FACE_FOR_SERVER_MOOD = {
  sleepy: 'sleepy',
  peckish: 'hungry',
  needs_cuddle: 'happy',
  content: 'happy',
  so_happy: 'playful',
};

export const faceForMood = (mood) => (FACE_MOODS.includes(mood) ? mood : FACE_FOR_SERVER_MOOD[mood] || 'happy');

// Server reaction kinds (POST /pets/{id}/actions) and fallback lines for the optimistic reaction
// shown before the server answers. The server picks the real line.
export const REACTION_KINDS = ['ate', 'already_full', 'played', 'too_sleepy', 'hugged', 'walked'];
export const ACTION_TO_KIND = { feed: 'ate', play: 'played', hug: 'hugged', walk: 'walked' };
export const FALLBACK_LINES = {
  ate: 'nom nom',
  already_full: 'not hungry right now, but thank you',
  played: 'so fun',
  too_sleepy: 'too sleepy, nap first?',
  hugged: 'best hug',
  walked: 'good walk',
};

export const DOG_FOODS = ['cookie', 'churro', 'fries', 'bowl'];
export const PLUSH_FOODS = ['matcha', 'cookie'];
