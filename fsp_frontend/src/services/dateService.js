import api from '../api/axiosConfig';

export const dateService = {
  // GET /dates?includeArchived=&categoryId=&status=
  getDates: async ({ includeArchived = false, categoryId, status } = {}) => {
    const params = new URLSearchParams();
    params.set('includeArchived', String(includeArchived));
    if (categoryId) params.set('categoryId', categoryId);
    if (status) params.set('status', status);
    const res = await api.get(`/dates?${params.toString()}`);
    return res.data?.data ?? [];
  },

  // GET /dates/{id}
  getDateById: async (id) => {
    const res = await api.get(`/dates/${id}`);
    return res.data?.data;
  },

  // POST /dates
  createDate: async (payload) => {
    const res = await api.post('/dates', payload);
    return res.data?.data;
  },

  // PUT /dates/{id}
  updateDate: async (id, payload) => {
    const res = await api.put(`/dates/${id}`, payload);
    return res.data?.data;
  },

  // DELETE /dates/{id}
  deleteDate: async (id) => {
    await api.delete(`/dates/${id}`);
  },

  // POST /dates/{id}/archive
  archiveDate: async (id) => {
    const res = await api.post(`/dates/${id}/archive`);
    return res.data?.data;
  },

  // POST /dates/{id}/restore
  restoreDate: async (id) => {
    const res = await api.post(`/dates/${id}/restore`);
    return res.data?.data;
  },

  // POST /dates/{id}/unarchive
  unarchiveDate: async (id) => {
    const res = await api.post(`/dates/${id}/unarchive`);
    return res.data?.data;
  },

  // POST /dates/{id}/duplicate
  duplicateDate: async (id) => {
    const res = await api.post(`/dates/${id}/duplicate`);
    return res.data?.data;
  },

  // POST/DELETE /dates/{id}/favorite
  setFavorite: async (id, favorite) => {
    const res = favorite
      ? await api.post(`/dates/${id}/favorite`)
      : await api.delete(`/dates/${id}/favorite`);
    return res.data?.data;
  },

  // DELETE /dates/all: hard-deletes the whole section (both accounts). Returns what was removed.
  deleteAll: async () => {
    const res = await api.delete('/dates/all');
    return res.data;
  },
};
