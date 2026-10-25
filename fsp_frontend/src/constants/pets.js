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
export const REACTION_KINDS = ['ate', 'already_full', 'played', 'too_sleepy', 'hugged', 'walked', 'wait'];
export const ACTION_TO_KIND = { feed: 'ate', play: 'played', hug: 'hugged', walk: 'walked' };
export const FALLBACK_LINES = {
  ate: 'nom nom',
  already_full: 'not hungry right now, but thank you',
  played: 'so fun',
  too_sleepy: 'too sleepy, nap first?',
  hugged: 'best hug',
  walked: 'good walk',
  wait: 'give me a moment, love',
};

export const DOG_FOODS = ['cookie', 'churro', 'fries', 'bowl'];
export const PLUSH_FOODS = ['matcha', 'cookie'];

// ---- copy: words instead of numbers, always gentle --------------------------------------
export const fullnessWord = (v) => (v < 35 ? 'peckish' : v <= 65 ? 'fine' : 'full');
export const energyWord = (v) => (v < 30 ? 'sleepy' : v < 70 ? 'calm' : 'zoomies');
export const joyWord = (v) => (v < 40 ? 'needs a cuddle' : v < 70 ? 'content' : 'so happy');

// One line about how a pet is, by the server's mood (already in priority order).
export function moodLine(name, mood) {
  switch (mood) {
    case 'sleepy': return `${name} is sleepy, a cuddle would be nice.`;
    case 'peckish': return `${name} is a little peckish.`;
    case 'needs_cuddle': return `${name} would love a hug.`;
    case 'so_happy': return `${name} is so happy you're here.`;
    default: return `${name} is having a good day.`;
  }
}

export const ACTIONS = [
  { id: 'feed', label: 'Feed', dogsOnly: false },
  { id: 'play', label: 'Play', dogsOnly: false },
  { id: 'hug', label: 'Hug', dogsOnly: false },
  { id: 'walk', label: 'Walk', dogsOnly: true },
];

const PAST = { feed: 'fed', play: 'played with', hug: 'hugged', walk: 'walked' };

export function timeAgo(iso, now = Date.now()) {
  const mins = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

// "You fed Zizi · just now" / "Cj hugged Zoey · 2h ago"; null before anyone has visited.
export function lastLine(pet, myId) {
  if (!pet?.last) return null;
  const who = pet.last.byUserId === myId ? 'You' : pet.last.byName || 'Someone';
  return `${who} ${PAST[pet.last.action] || 'visited'} ${pet.name} · ${timeAgo(pet.last.at)}`;
}

// Remember the last pet looked at for this tab.
const SELECTED_KEY = 'fsp-pet-selected';
export function rememberPet(id) {
  try { sessionStorage.setItem(SELECTED_KEY, id); } catch { /* storage unavailable */ }
}
export function lastPetId() {
  try { return sessionStorage.getItem(SELECTED_KEY); } catch { return null; }
}
