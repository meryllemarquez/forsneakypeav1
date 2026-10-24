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
  [/plush|chimken|rorry/i, 'plush'],
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

function pick(text, fallback) {
  const hit = RULES.find(([pattern]) => pattern.test(text || ''));
  return hit ? hit[1] : fallback;
}

export const albumIcon = (name) => pick(name, 'camera');
export const dateIcon = (title, location) => pick(`${title || ''} ${location || ''}`, 'ticket');

// An album's doodle: the one picked in the album form when there is one, else the keyword pick.
// The pick is stored in the existing `iconStyle` text column as "doodle:<name>". Anything else
// (the legacy default "camera", or empty) means "automatic".
const OVERRIDE_PREFIX = 'doodle:';

export function storedDoodle(iconStyle) {
  if (typeof iconStyle !== 'string' || !iconStyle.startsWith(OVERRIDE_PREFIX)) return null;
  const name = iconStyle.slice(OVERRIDE_PREFIX.length);
  return ICON_NAMES.includes(name) ? name : null;
}

export const doodleToIconStyle = (name) => (name ? `${OVERRIDE_PREFIX}${name}` : 'camera');

export const resolveAlbumIcon = (folder) => storedDoodle(folder?.iconStyle) || albumIcon(folder?.name);
