import api from '../api/axiosConfig';

// NotificationBell mounts fresh on every page (it lives inside Navbar, which
// each page renders individually rather than sharing one layout instance), so
// without this it re-fetches the same list from scratch on every navigation.
// Short TTL cache + in-flight de-dupe means rapid nav (Home -> Memories ->
// Dates) reuses one fetch instead of firing a new request per page, while
// still staying fresh — any mutation below clears the cache immediately.
const CACHE_TTL_MS = 15000;
let cache = null; // { data, expiresAt }
let inFlight = null;

const invalidate = () => {
  cache = null;
  inFlight = null;
};

export const notificationService = {
  // Exposed so logout can drop any cached notifications before a different
  // account logs in on the same browser.
  clearCache: invalidate,

  getNotifications: async (unreadOnly = false, { force = false } = {}) => {
    // Only the default (all-notifications) call is cached — the unreadOnly
    // variant is used rarely enough that caching it isn't worth the extra
    // cache-key complexity.
    if (!unreadOnly && !force) {
      if (cache && cache.expiresAt > Date.now()) return cache.data;
      if (inFlight) return inFlight;
    }

    const request = api
      .get('/notifications', { params: unreadOnly ? { unreadOnly: true } : undefined })
      .then((res) => {
        if (!unreadOnly) {
          cache = { data: res.data, expiresAt: Date.now() + CACHE_TTL_MS };
        }
        return res.data;
      })
      .finally(() => {
        inFlight = null;
      });

    if (!unreadOnly && !force) inFlight = request;
    return request;
  },

  markRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    invalidate();
    return res.data;
  },

  markAllRead: async () => {
    await api.patch('/notifications/read-all');
    invalidate();
  },

  deleteNotification: async (id) => {
    await api.delete(`/notifications/${id}`);
    invalidate();
  },
};
