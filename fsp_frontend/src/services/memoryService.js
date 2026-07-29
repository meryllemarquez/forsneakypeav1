import api from '../api/axiosConfig';

export const memoryService = {
  // GET /api/memories/folders
  getFolders: async (includeArchived = false) => {
    const res = await api.get(`/memories/folders?includeArchived=${includeArchived}`);
    return res.data;
  },

  // GET /api/memories/folders/{id}
  getFolderById: async (id) => {
    const res = await api.get(`/memories/folders/${id}`);
    return res.data;
  },

  // POST /api/memories/folders
  createFolder: async (folderData) => {
    const res = await api.post('/memories/folders', folderData);
    return res.data;
  },

  // PUT /api/memories/folders/{id}
  updateFolder: async (id, folderData) => {
    const res = await api.put(`/memories/folders/${id}`, folderData);
    return res.data;
  },

  // DELETE /api/memories/folders/{id}
  deleteFolder: async (id) => {
    await api.delete(`/memories/folders/${id}`);
  },

  // POST /api/memories/folders/{folderId}/photos
  addPhotoToFolder: async (folderId, photoData) => {
    const res = await api.post(`/memories/folders/${folderId}/photos`, photoData);
    return res.data;
  },

  // PUT /api/memories/photos/{photoId}
  updatePhoto: async (photoId, updateData) => {
    const res = await api.put(`/memories/photos/${photoId}`, updateData);
    return res.data;
  },

  // DELETE /api/memories/photos/{photoId}
  deletePhoto: async (photoId) => {
    await api.delete(`/memories/photos/${photoId}`);
  },

  // GET /api/memories/photos/favorites
  getFavorites: async () => {
    const res = await api.get('/memories/photos/favorites');
    return res.data;
  }
};