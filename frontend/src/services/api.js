import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('tf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tf_token');
      localStorage.removeItem('tf_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authService = {
  register: (d) => API.post('/auth/register', d),
  login: (d) => API.post('/auth/login', d),
  getMe: () => API.get('/auth/me'),
  searchUsers: (q) => API.get('/auth/users', { params: { q } }),
};

export const taskService = {
  getAll: (params) => API.get('/tasks', { params }),
  getShared: () => API.get('/tasks/shared'),
  getById: (id) => API.get(`/tasks/${id}`),
  create: (d) => API.post('/tasks', d),
  update: (id, d) => API.put(`/tasks/${id}`, d),
  delete: (id) => API.delete(`/tasks/${id}`),
  share: (id, userIds) => API.put(`/tasks/${id}/share`, { userIds }),
  uploadAttachment: (id, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return API.post(`/tasks/${id}/attachments`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteAttachment: (taskId, attId) => API.delete(`/tasks/${taskId}/attachments/${attId}`),
};

export const notificationService = {
  getAll: () => API.get('/notifications'),
  markRead: (id) => API.put(`/notifications/${id}/read`),
  markAllRead: () => API.put('/notifications/read-all'),
  delete: (id) => API.delete(`/notifications/${id}`),
};

export const analyticsService = {
  getOverview: () => API.get('/analytics/overview'),
  getTrends: (period) => API.get('/analytics/trends', { params: { period } }),
};

export default API;
