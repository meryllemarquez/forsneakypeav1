import api from '../api/axiosConfig';

export const loveBoardService = {
  // GET /love-board/notes
  getNotes: async () => {
    const res = await api.get('/love-board/notes');
    return res.data;
  },

  // GET /love-board/notes/{id}
  getNoteById: async (id) => {
    const res = await api.get(`/love-board/notes/${id}`);
    return res.data;
  },

  // POST /love-board/notes
  createNote: async (noteData) => {
    const res = await api.post('/love-board/notes', noteData);
    return res.data;
  },

  // PUT /love-board/notes/{id}
  updateNote: async (id, noteData) => {
    const res = await api.put(`/love-board/notes/${id}`, noteData);
    return res.data;
  },

  // PATCH /love-board/notes/{id}/position
  updateNotePosition: async (id, positionData) => {
    const res = await api.patch(`/love-board/notes/${id}/position`, positionData);
    return res.data;
  },

  // DELETE /love-board/notes/{id}
  deleteNote: async (id) => {
    await api.delete(`/love-board/notes/${id}`);
  },

  // GET /love-board/stickers
  getStickers: async () => {
    const res = await api.get('/love-board/stickers');
    return res.data;
  },

  // POST /love-board/stickers
  createSticker: async (stickerData) => {
    const res = await api.post('/love-board/stickers', stickerData);
    return res.data;
  },

  // PATCH /love-board/stickers/{id}
  updateSticker: async (id, stickerData) => {
    const res = await api.patch(`/love-board/stickers/${id}`, stickerData);
    return res.data;
  },

  // DELETE /love-board/stickers/{id}
  deleteSticker: async (id) => {
    await api.delete(`/love-board/stickers/${id}`);
  },
};
