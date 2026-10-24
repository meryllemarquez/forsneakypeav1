import { ICON_NAMES } from '../components/Icon';

// Picks a doodle for things that have no picture of their own (an album without a cover, a date
// without a category icon) from keywords in the name. First match wins, so specific places and
// foods come before the broad ones. Edit freely: it is just a list.
const RULES = [
  [/sky ?ranch|ferris/i, 'ferris'],
  [/arcade|claw/i, 'claw'],
  [/karaoke|singing|\bmic\b/i, 'mic'],
  [/ph arena|arena|nlex/i, 'arena'],
  [/lechon/i, 'lechon'],
  [/pares|bulalo|bowl|ramen|soup/i, 'bowl'],
  [/yogurt|yowell/i, 'yogurt'],
  [/pizza|spinach/i, 'pizza'],
  [/donut|alcapone|boston/i, 'donut'],
  [/matcha|coffee|cafe|\btea\b/i, 'matcha'],
  [/churro/i, 'churro'],
  [/lasagna/i, 'lasagna'],
  [/fries/i, 'fries'],
  [/cookie/i, 'cookie'],
  [/museum/i, 'museum'],
  [/ticket|exhibit|pinto|natmu/i, 'ticket'],
  [/tanay|infanta|river|beach|hike|hiking|mountain|trek|falls|camp/i, 'mountain'],
  [/tagaytay|staycation|hotel|resort|airbnb|\bstay\b/i, 'bed'],
  [/motmot|\bride\b|roadtrip|road trip|drive|\bcar\b|diecast/i, 'motmot'],
  [/\brc\b/i, 'rc'],
  [/movie|film|cinema/i, 'film'],
  [/video/i, 'videocam'],
  [/vinyl|opm|concert|music|\bband\b/i, 'vinyl'],
  [/cassette|mixtape/i, 'cassette'],
  [/dog|zizi|loafie|zoey|tato|cooper/i, 'dog'],
  [/skyrie|\bball\b/i, 'ball'],
  [/chimken/i, 'chimken'],
  [/rorry|octopus/i, 'rorry'],
  [/plush|junebug|avocado/i, 'plush'],
  [/tulip|flower/i, 'tulip'],
  [/daisy|garden/i, 'daisy'],
  [/sunrise|sunset|summer|\bsun\b/i, 'sun'],
  [/flight|plane|airport|\bmet\b/i, 'plane'],
  [/tree|nature|forest|park/i, 'tree'],
  [/letter|love note/i, 'envelope'],
  [/birthday|anniv|surprise|celebrat|party/i, 'sparkle'],
  [/first date|date night|\bdate\b|dinner|lunch|foodtrip|food trip|\beat\b|resto/i, 'utensils'],
  [/photo|camera/i, 'camera'],
];

// The doodle for some text, or null when no keyword matches.
export function findDoodle(text) {
  const hit = RULES.find(([pattern]) => pattern.test(text || ''));
  return hit ? hit[1] : null;
}

const pick = (text, fallback) => findDoodle(text) || fallback;

export const albumIcon = (name) => pick(name, 'camera');
export const dateIcon = (title, location) => pick(`${title || ''} ${location || ''}`, 'ticket');

// An album's look is kept in the existing `iconStyle` text column (no backend change):
//   "doodle:<name>"   the doodle picked in the album form
//   "cover"           the album opted in to showing a photo as its cover
// joined with "|" (for example "doodle:plane|cover"). Anything else, including the legacy default
// "camera", means "automatic doodle, no photo cover". Albums are private by default: a photo
// shows as the cover only when "cover" is present.
export function parseIconStyle(iconStyle) {
  const parts = typeof iconStyle === 'string' ? iconStyle.split('|') : [];
  let doodle = null;
  let cover = false;
  for (const part of parts) {
    if (part.startsWith('doodle:')) {
      const name = part.slice('doodle:'.length);
      if (ICON_NAMES.includes(name)) doodle = name;
    } else if (part === 'cover') {
      cover = true;
    }
  }
  return { doodle, cover };
}

export function buildIconStyle({ doodle = null, cover = false } = {}) {
  const parts = [];
  if (doodle) parts.push(`doodle:${doodle}`);
  if (cover) parts.push('cover');
  return parts.length > 0 ? parts.join('|') : 'camera';
}

export const storedDoodle = (iconStyle) => parseIconStyle(iconStyle).doodle;

// The photo to show as an album's cover, or null (the doodle tile is shown instead).
export const albumCoverUrl = (folder) => (parseIconStyle(folder?.iconStyle).cover && folder?.coverImageUrl) || null;

export const resolveAlbumIcon = (folder) => storedDoodle(folder?.iconStyle) || albumIcon(folder?.name);
