import api from '../api/axiosConfig';

export const activityLogService = {
  // filters: { userId, module, status, action, from, to, page, size, sort }
  search: async (filters = {}) => {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const res = await api.get('/activity-logs', { params });
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/activity-logs/${id}`);
    return res.data;
  },
};
