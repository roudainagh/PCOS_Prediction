// services/api.js
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — auto-attach token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — clear storage so AuthContext re-hydrates as logged-out
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (data) =>
    api.post('/auth/signup', {
      username: data.username,
      email: data.email,
      password: data.password,
      confirm_password: data.confirm_password,
      location: data.location,
    }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
};

export const adminAPI = {
  getAllUsers: () => api.get('/auth/admin/users'),
  getLastMonthUsers: () => api.get('/auth/admin/users/last-month'),
  getAllSymptoms: () => api.get('/auth/admin/stats/symptoms'),
  getAllClinical: () => api.get('/auth/admin/stats/clinical'),
};

export const pcosAPI = {
  submitSymptoms: (data) => api.post('/pcos/symptoms', data),
  // Upload one or more lab images for clinical prediction
  uploadImages: (files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return api.post('/pcos/clinical/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getSymptomsHistory: () => api.get('/pcos/history/symptoms'),
  getClinicalHistory: () => api.get('/pcos/history/clinical'),
};


export const chatAPI = {
  sendMessage: (messages) =>
    fetch(`${API_BASE_URL}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: JSON.stringify({ messages }),
    }),
};


export default api;


