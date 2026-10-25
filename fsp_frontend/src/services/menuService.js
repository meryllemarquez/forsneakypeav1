import api from '../api/axiosConfig';

export const menuService = {
  // GET /menu-items
  getItems: async () => {
    const res = await api.get('/menu-items');
    return res.data;
  },

  // POST /menu-items  (body may include afterId; null = last)
  createItem: async (payload) => {
    const res = await api.post('/menu-items', payload);
    return res.data;
  },

  // PUT /menu-items/{id}  (body must include the item's current version)
  updateItem: async (id, payload) => {
    const res = await api.put(`/menu-items/${id}`, payload);
    return res.data;
  },

  // DELETE /menu-items/{id}
  deleteItem: async (id) => {
    await api.delete(`/menu-items/${id}`);
  },

  // PUT /menu-items/order  (full list of ids in the new order)
  reorderItems: async (ids) => {
    const res = await api.put('/menu-items/order', { ids });
    return res.data;
  },
};
