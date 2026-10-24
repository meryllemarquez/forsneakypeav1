import api from '../api/axiosConfig';

export const profileService = {
  // GET /api/profile
  getProfile: async () => {
    const res = await api.get('/profile');
    return res.data?.data || res.data;
  },

  // PUT /api/profile
  updateProfile: async (payload) => {
    const res = await api.put('/profile', payload);
    return res.data?.data || res.data;
  },

  // PUT /api/profile/avatar
  updateAvatar: async ({ driveFileId }) => {
    const res = await api.put('/profile/avatar', { driveFileId });
    return res.data?.data || res.data;
  },

  // DELETE /api/profile/avatar
  removeAvatar: async () => {
    const res = await api.delete('/profile/avatar');
    return res.data?.data || res.data;
  },
};
