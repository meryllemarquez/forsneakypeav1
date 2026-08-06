import api from '../api/axiosConfig';

export const auditService = {
  list: async (page = 0, size = 25) => {
    const res = await api.get('/audit', { params: { page, size } });
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/audit/${id}`);
    return res.data;
  },
};
