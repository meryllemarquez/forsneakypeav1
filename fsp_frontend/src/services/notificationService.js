import api from '../api/axiosConfig';

export const notificationService = {
  getNotifications: async (unreadOnly = false) => {
    const res = await api.get('/notifications', { params: unreadOnly ? { unreadOnly: true } : undefined });
    return res.data;
  },

  markRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  markAllRead: async () => {
    await api.patch('/notifications/read-all');
  },

  deleteNotification: async (id) => {
    await api.delete(`/notifications/${id}`);
  },
};
