// Picks a doodle for things that have no picture of their own (an album without a cover, a date
// without a category icon) from keywords in the name. Falls back to a sensible default.
const RULES = [
  [/pares|bulalo|lechon|food|eat|lunch|dinner|kain|resto|buffet|churro|pizza|lasagna/i, 'utensils'],
  [/matcha|coffee|cafe|tea|yowell|yogurt|dessert|donut/i, 'matcha'],
  [/museum|art|gallery|exhibit/i, 'museum'],
  [/mountain|hike|trek|tanay|infanta|baguio|nature|falls|river|camp/i, 'mountain'],
  [/drive|car|ride|road|motmot|nlex|skyway|trip|travel/i, 'motmot'],
  [/beach|sun|summer|sunset|sunrise|tagaytay/i, 'sun'],
  [/concert|music|song|band|opm|karaoke|vinyl/i, 'vinyl'],
  [/movie|film|cinema/i, 'film'],
  [/dog|pet|zizi|loafie|zoey|tato|cooper/i, 'dog'],
  [/flower|garden|tulip|daisy/i, 'tulip'],
  [/stay|hotel|bed|resort|airbnb/i, 'bed'],
  [/arcade|game|claw/i, 'claw'],
  [/fair|ferris|sky ranch|amusement|theme park/i, 'ferris'],
  [/birthday|anniv|party|celebrat|surprise|date night/i, 'sparkle'],
  [/flight|plane|airport/i, 'plane'],
  [/ticket|show|event/i, 'ticket'],
];

function pick(text, fallback) {
  const hit = RULES.find(([pattern]) => pattern.test(text || ''));
  return hit ? hit[1] : fallback;
}

export const albumIcon = (name) => pick(name, 'camera');
export const dateIcon = (title, location) => pick(`${title || ''} ${location || ''}`, 'ticket');
