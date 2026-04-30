import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes('/auth/login');
    
    if (err.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

export const customersApi = {
  getAll: () => api.get('/customers'),
  getOne: (id) => api.get(`/customers/${id}`),
  create: (formData) => api.post('/customers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update: (id, data) => api.patch(`/customers/${id}`, data),
  getKycBlob: (filename) => api.get(`/customers/kyc/view/${filename}`, { responseType: 'blob' }),
};

export const loansApi = {
  create: (data) => api.post('/loans', data),
  getAll: () => api.get('/loans'),
  getOne: (id) => api.get(`/loans/${id}`),
  addRepayment: (id, data) => api.post(`/loans/${id}/repayments`, data),
};

export const dashboardApi = {
  getMetrics: () => api.get('/dashboard'),
};

export const susuApi = {
  getContributions: () => api.get('/susu/contributions'),
  getWithdrawals: () => api.get('/susu/withdrawals'),
  getCustomerContributions: (customerId) => api.get(`/susu/customer/${customerId}`),
  createDeposit: (data) => api.post('/susu/deposit', data),
  createWithdrawal: (data) => api.post('/susu/withdraw', data),
  getBalance: (customerId) => api.get(`/susu/balance/${customerId}`),
};

export default api;
