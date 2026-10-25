import api from '../api/axiosConfig';

export const wheelService = {
  // GET /wheels  (newest-updated first)
  getWheels: async () => {
    const res = await api.get('/wheels');
    return res.data;
  },

  // POST /wheels  { name, choices: [{ id, label, color, doodle }] }
  createWheel: async (payload) => {
    const res = await api.post('/wheels', payload);
    return res.data;
  },

  // PUT /wheels/{id}  (body must include the wheel's current version; 409 on a clash)
  updateWheel: async (id, payload) => {
    const res = await api.put(`/wheels/${id}`, payload);
    return res.data;
  },

  // DELETE /wheels/{id}  (its spins go too)
  deleteWheel: async (id) => {
    await api.delete(`/wheels/${id}`);
  },

  // GET /wheels/{id}/spins?limit=8
  getSpins: async (id, limit = 8) => {
    const res = await api.get(`/wheels/${id}/spins`, { params: { limit } });
    return res.data;
  },

  // POST /wheels/{id}/spins  { choiceId, label? }  (label is only used if the choice was removed)
  addSpin: async (id, payload) => {
    const res = await api.post(`/wheels/${id}/spins`, payload);
    return res.data;
  },

  // PATCH /wheels/spins/{spinId}  { accepted }
  setSpinAccepted: async (spinId, accepted) => {
    const res = await api.patch(`/wheels/spins/${spinId}`, { accepted });
    return res.data;
  },

  // DELETE /wheels/{id}/spins
  clearSpins: async (id) => {
    await api.delete(`/wheels/${id}/spins`);
  },
};
