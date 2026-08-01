import api from '../api/axiosConfig';

export const checklistService = {
  // GET /dates/{dateId}/checklist-items
  getItems: async (dateId) => {
    const res = await api.get(`/dates/${dateId}/checklist-items`);
    return res.data?.data ?? [];
  },

  // POST /dates/{dateId}/checklist-items — payload: { title, description?, dueDate?, priority? }
  createItem: async (dateId, payload) => {
    const body = typeof payload === 'string' ? { title: payload } : payload;
    const res = await api.post(`/dates/${dateId}/checklist-items`, body);
    return res.data?.data;
  },

  // PUT /dates/{dateId}/checklist-items/{itemId} — payload: { title?, description?, dueDate?, priority?, isCompleted? }
  updateItem: async (dateId, itemId, payload) => {
    const res = await api.put(`/dates/${dateId}/checklist-items/${itemId}`, payload);
    return res.data?.data;
  },

  // PUT toggle helper
  toggleItem: async (dateId, itemId, isCompleted) => {
    const res = await api.put(`/dates/${dateId}/checklist-items/${itemId}`, { isCompleted });
    return res.data?.data;
  },

  // DELETE /dates/{dateId}/checklist-items/{itemId}
  deleteItem: async (dateId, itemId) => {
    await api.delete(`/dates/${dateId}/checklist-items/${itemId}`);
  },

  // PUT /dates/{dateId}/checklist-items/reorder — body: { orderedIds: [uuid, ...] }
  reorderItems: async (dateId, orderedIds) => {
    const res = await api.put(`/dates/${dateId}/checklist-items/reorder`, { orderedIds });
    return res.data?.data ?? [];
  },
};
