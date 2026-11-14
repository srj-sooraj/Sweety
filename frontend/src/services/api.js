import axios from 'axios';

const TOKEN_KEY = 'sweety_auth_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getStoredToken()) {
      const requestUrl = error.config?.url || '';
      if (!requestUrl.includes('/auth/login') && !requestUrl.includes('/auth/register')) {
        setStoredToken(null);
        window.dispatchEvent(new Event('sweety:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export function extractApiError(error, fallbackMessage = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  return {
    message: data?.message || error?.message || fallbackMessage,
    fieldErrors: data?.errors || {},
  };
}

export const authApi = {
  async register(payload) {
    const res = await apiClient.post('/auth/register', payload);
    return res.data.data;
  },
  async login(payload) {
    const res = await apiClient.post('/auth/login', payload);
    return res.data.data;
  },
  async me() {
    const res = await apiClient.get('/auth/me');
    return res.data.data;
  },
};

export const readingsApi = {
  async list(params = {}) {
    const res = await apiClient.get('/readings', { params });
    return res.data.data.readings;
  },
  async getOne(id) {
    const res = await apiClient.get(`/readings/${id}`);
    return res.data.data.reading;
  },
  async create(payload) {
    const res = await apiClient.post('/readings', payload);
    return res.data.data.reading;
  },
  async update(id, payload) {
    const res = await apiClient.put(`/readings/${id}`, payload);
    return res.data.data.reading;
  },
  async remove(id) {
    const res = await apiClient.delete(`/readings/${id}`);
    return res.data.data;
  },
};

export const reportsApi = {
  async daily(date) {
    const res = await apiClient.get('/reports/daily', {
      params: date ? { date } : {},
    });
    return res.data.data;
  },
  async monthToDate() {
    const res = await apiClient.get('/reports/month-to-date');
    return res.data.data;
  },
  async previousMonth() {
    const res = await apiClient.get('/reports/previous-month');
    return res.data.data;
  },
};
