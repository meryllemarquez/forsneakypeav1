import api from '../api/axiosConfig';

export const bouquetService = {
  // GET /bouquets  (newest first, max 200)
  getBouquets: async () => {
    const res = await api.get('/bouquets');
    return res.data;
  },

  // GET /bouquets/{id}
  getBouquet: async (id) => {
    const res = await api.get(`/bouquets/${id}`);
    return res.data;
  },

  // POST /bouquets  { title, recipe }
  createBouquet: async (payload) => {
    const res = await api.post('/bouquets', payload);
    return res.data;
  },

  // PUT /bouquets/{id}  { title, recipe, version }  (409 if the version is stale)
  updateBouquet: async (id, payload) => {
    const res = await api.put(`/bouquets/${id}`, payload);
    return res.data;
  },

  // DELETE /bouquets/{id}  (also removes Love Board stickers pinning it)
  deleteBouquet: async (id) => {
    await api.delete(`/bouquets/${id}`);
  },

  // DELETE /bouquets/all  (bouquets and their pinned stickers)
  deleteAllBouquets: async () => {
    const res = await api.delete('/bouquets/all');
    return res.data;
  },
};
