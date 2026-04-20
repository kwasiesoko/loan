import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
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
};

export const customersApi = {
  getAll: () => api.get('/customers'),
  getOne: (id) => api.get(`/customers/${id}`),
  create: (formData) => api.post('/customers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
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
  getCustomerContributions: (customerId) => api.get(`/susu/customer/${customerId}`),
  createDeposit: (data) => api.post('/susu/deposit', data),
};

export default api;
