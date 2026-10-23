// Every query key in one place. Keys are hierarchical so a prefix invalidates a whole family,
// e.g. invalidating ['folders'] covers the list for any includeArchived value.
export const queryKeys = {
  folders: (includeArchived = false) => ['folders', { includeArchived }],
  calendar: (year, month) => ['calendar', year, month],
  dates: (includeArchived = false) => ['dates', { includeArchived }],
  dateCategories: () => ['date-categories'],
  loveNotes: () => ['love-notes'],
  loveStickers: () => ['love-stickers'],
  notifications: () => ['notifications'],
  profile: () => ['profile'],
  homeSummary: (today) => ['home', 'summary', today],
};

// Prefixes used for invalidation (see mutations.js for which mutation touches which).
export const keyFamilies = {
  folders: ['folders'],
  calendar: ['calendar'],
  dates: ['dates'],
  home: ['home'],
  loveNotes: ['love-notes'],
  loveStickers: ['love-stickers'],
  notifications: ['notifications'],
  profile: ['profile'],
};
