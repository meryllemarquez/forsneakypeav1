import api from '../api/axiosConfig';

// Plain API calls only. Caching, de-duplication and freshness are handled by TanStack Query
// (see queries/queries.js and queries/useNotifications.js).
export const notificationService = {
  // GET /notifications — the backend returns the latest 50.
  getNotifications: async (unreadOnly = false) => {
    const res = await api.get('/notifications', { params: unreadOnly ? { unreadOnly: true } : undefined });
    return res.data;
  },

  // PATCH /notifications/{id}/read
  markRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  // PATCH /notifications/read-all
  markAllRead: async () => {
    await api.patch('/notifications/read-all');
  },

  // DELETE /notifications/{id}
  deleteNotification: async (id) => {
    await api.delete(`/notifications/${id}`);
  },
};
