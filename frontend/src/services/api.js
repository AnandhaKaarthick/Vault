import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach user token & user_id headers automatically
api.interceptors.request.use((config) => {
  const userJson = localStorage.getItem('vault_user');
  const token = localStorage.getItem('vault_token');

  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user && user.id) {
        config.headers['X-User-Id'] = user.id;
      }
    } catch (e) {
      console.error('Error parsing stored user:', e);
    }
  }

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Auth API Calls
export const loginUser = async (usernameOrEmail, password) => {
  const response = await api.post('/auth/login', {
    username_or_email: usernameOrEmail,
    password: password
  });
  return response.data;
};

export const registerUser = async (username, email, password, fullName) => {
  const response = await api.post('/auth/register', {
    username,
    email,
    password,
    full_name: fullName
  });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Document API Calls
export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const checkJobStatus = async (jobId) => {
  const response = await api.get(`/documents/jobs/${jobId}`);
  return response.data;
};

export const listDocuments = async (params = {}) => {
  const response = await api.get('/documents', { params });
  return response.data;
};

export const getDocument = async (docId, pin = null) => {
  const headers = {};
  if (pin) {
    headers['X-Security-Pin'] = pin;
  }
  const response = await api.get(`/documents/${docId}`, { headers });
  return response.data;
};

export const renameDocument = async (docId, newFilename) => {
  const response = await api.patch(`/documents/${docId}/rename`, { new_filename: newFilename });
  return response.data;
};

export const toggleStarDocument = async (docId) => {
  const response = await api.patch(`/documents/${docId}/star`);
  return response.data;
};

export const deleteDocument = async (docId) => {
  const response = await api.delete(`/documents/${docId}`);
  return response.data;
};

export const searchDocuments = async (query) => {
  const response = await api.post('/search', { query });
  return response.data;
};

export const verifyPin = async (pin) => {
  const response = await api.post('/documents/security/verify-pin', { pin });
  return response.data;
};

export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettings = async (data) => {
  const response = await api.post('/settings', data);
  return response.data;
};

export default api;
