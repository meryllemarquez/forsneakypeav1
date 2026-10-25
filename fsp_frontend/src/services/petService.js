import api from '../api/axiosConfig';

export const petService = {
  // GET /pets  -> { serverTime, pets: [{ id, name, kind, stats, mood, counts, last }] }
  getPets: async () => {
    const res = await api.get('/pets');
    return res.data;
  },

  // POST /pets/{id}/actions  { action: 'feed'|'play'|'hug'|'walk' } -> { pet, reaction: { kind, line } }
  // 429 = cooldown, 400 = a plushie asked to walk.
  act: async (id, action) => {
    const res = await api.post(`/pets/${id}/actions`, { action });
    return res.data;
  },
};
