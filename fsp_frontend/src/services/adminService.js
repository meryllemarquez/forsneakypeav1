import api from '../api/axiosConfig';

export const adminService = {
  getDashboard: async () => {
    const res = await api.get('/admin/dashboard');
    return res.data;
  },

  getUsers: async () => {
    const res = await api.get('/admin/users');
    return res.data;
  },

  getUser: async (id) => {
    const res = await api.get(`/admin/users/${id}`);
    return res.data;
  },

  setUserActive: async (id, active, reason) => {
    const res = await api.patch(`/admin/users/${id}`, { active, reason });
    return res.data;
  },

  deleteUser: async (id, reason) => {
    await api.delete(`/admin/users/${id}`, { params: reason ? { reason } : undefined });
  },
};
