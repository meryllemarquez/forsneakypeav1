// Single source of truth for the relationship anniversary date, shared by
// HomePage's hero badge and the Profile page's Anniversary Counter card so
// the two never drift out of sync.
export const ANNIVERSARY_DATE = Date.UTC(2024, 0, 28); // January 28, 2024
export const ANNIVERSARY_LABEL = 'together since Jan 28, 2024';

export function getDaysTogether() {
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diffInDays = Math.floor((todayUtc - ANNIVERSARY_DATE) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffInDays);
}
