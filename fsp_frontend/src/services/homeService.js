import api from '../api/axiosConfig';

export const homeService = {
  // GET /api/v1/home/summary?today=YYYY-MM-DD
  // Everything the Home page shows (3 albums, 2 upcoming dates, latest note) in one small
  // response. `today` is the viewer's local date so "upcoming" matches their calendar.
  getSummary: async (today) => {
    const res = await api.get('/home/summary', { params: today ? { today } : undefined });
    return res.data;
  },
};
