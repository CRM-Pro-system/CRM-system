import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto logout on 401 - token expired or invalid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenantId');
        localStorage.removeItem('tenantName');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// Users API
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  registerAgent: (data) => api.post('/users', data),
  resendOTP: (id) => api.post(`/users/${id}/resend-otp`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  getProfile: () => api.get('/users/profile/me'),
  updateProfile: (data) => api.put('/users/profile', data),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivities: () => api.get('/dashboard/activities'),
};

// Clients API
export const clientsAPI = {
  getAll: (params) => api.get('/clients', { params }),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
  addInteraction: (id, data) => api.post(`/clients/${id}/interactions`, data),
  addTask: (id, data) => api.post(`/clients/${id}/tasks`, data),
  sendEmail: (id, data) => api.post(`/clients/${id}/send-email`, data),
  exportCSV: async (params) => {
    const res = await api.get('/clients', { params: { ...params, limit: 1000 } });
    const clients = res.data?.clients || res.data || [];
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Priority', 'Created'];
    const rows = clients.map(c => [
      c.name, c.email, c.phone, c.company || '', c.status, c.priority,
      new Date(c.createdAt).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    return { data: csv };
  }
};

// Deals API
export const dealsAPI = {
  getAll: (params) => api.get('/deals', { params }),
  getById: (id) => api.get(`/deals/${id}`),
  create: (data) => api.post('/deals', data),
  update: (id, data) => api.put(`/deals/${id}`, data),
  updateStatus: (id, status) => api.patch(`/deals/${id}/status`, { status }),
  delete: (id) => api.delete(`/deals/${id}`),
  getStats: () => api.get('/deals/stats'),
};

// Sales API
export const salesAPI = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  delete: (id) => api.delete(`/sales/${id}`),
  getStats: (params) => api.get('/sales/stats', { params }),
  getSummary: (params) => api.get('/sales/summary', { params }),
  recordPayment: (id, data) => api.post(`/sales/${id}/payment`, data),
  getRecent: (params) => api.get('/sales/recent/list', { params }),
};

// Schedules API
export const schedulesAPI = {
  getAll: (params) => api.get('/schedules', { params }),
  getById: (id) => api.get(`/schedules/${id}`),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.put(`/schedules/${id}`, data),
  delete: (id) => api.delete(`/schedules/${id}`),
};

// Notifications API
export const notificationsAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  delete: (id) => api.delete(`/notifications/${id}`),
  getStats: () => api.get('/notifications/stats/summary'),
};

// Performance API
export const performanceAPI = {
  getAgentStats: (agentId) => api.get(`/performance/agent/${agentId}`),
  getOverall: () => api.get('/performance/overall'),
  getRankings: () => api.get('/performance/rankings'),
  recalculate: () => api.post('/performance/recalculate-ratings'),
};

// Reports API
export const reportsAPI = {
  getAnalytics: (params) => api.get('/reports/analytics', { params }),
  shareReport: (data) => api.post('/reports/share', data),
  importData: (formData) => api.post('/reports/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Settings API
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};

// Tenants API (Super Admin only)
export const tenantsAPI = {
  getAll: () => api.get('/tenants'),
  getById: (id) => api.get(`/tenants/${id}`),
  create: (data) => api.post('/tenants', data),
  update: (id, data) => api.put(`/tenants/${id}`, data),
  updateStatus: (id, status) => api.patch(`/tenants/${id}/status`, { status }),
  getStats: (id) => api.get(`/tenants/${id}/stats`),
};

// Audit Logs API
export const auditLogsAPI = {
  getAll: (params) => api.get('/audit-logs', { params }),
  getStats: () => api.get('/audit-logs/stats'),
};

// Meetings API
export const meetingsAPI = {
  getAll: (params) => api.get('/meetings', { params }),
  getById: (id) => api.get(`/meetings/${id}`),
  create: (data) => api.post('/meetings', data),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  delete: (id) => api.delete(`/meetings/${id}`),
};

// Stock API
export const stockAPI = {
  getAll: (params) => api.get('/stock', { params }),
  getById: (id) => api.get(`/stock/${id}`),
  create: (data) => api.post('/stock', data),
  update: (id, data) => api.put(`/stock/${id}`, data),
  delete: (id) => api.delete(`/stock/${id}`),
  getLowStock: () => api.get('/stock/low-stock'),
};

// OTP API
export const otpAPI = {
  generate: (data) => api.post('/otp/generate', data),
  verify: (data) => api.post('/otp/verify', data),
};

// Upload API
export const uploadAPI = {
  uploadFile: (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
  },
  deleteFile: (filename) => api.delete(`/upload/${filename}`),
};

// Default export
export default api;