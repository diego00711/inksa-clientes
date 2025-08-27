import { api } from '../lib/api';

const ClientService = {
  getProfile: async () => {
    return api.get('/api/client/profile', { auth: true });
  },

  updateProfile: async (profileData) => {
    return api.put('/api/client/profile', profileData, { auth: true });
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const result = await api.postForm('/api/client/upload-avatar', formData, { auth: true });
    return result?.avatar_url ?? result;
  },
};

export default ClientService;