import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatic Request Interceptor for User ID & Token
api.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem('vault_user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user && user.id) {
        config.headers['X-User-Id'] = user.id;
      }
    } catch (e) {}
  } else {
    config.headers['X-User-Id'] = 'usr_anandha';
  }

  const savedToken = localStorage.getItem('vault_token');
  if (savedToken) {
    config.headers['Authorization'] = `Bearer ${savedToken}`;
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

// Authentication APIs
export const loginUser = async (username, password) => {
  const response = await api.post('/auth/login', { username, password });
  if (response.data && response.data.token) {
    localStorage.setItem('vault_token', response.data.token);
    localStorage.setItem('vault_user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const registerUser = async (username, password, fullName = '') => {
  const response = await api.post('/auth/register', { username, password, full_name: fullName });
  if (response.data && response.data.token) {
    localStorage.setItem('vault_token', response.data.token);
    localStorage.setItem('vault_user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Document Management APIs
export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
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

export const updateDocumentTags = async (docId, tags) => {
  const response = await api.patch(`/documents/${docId}/tags`, { tags });
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

export const updateSettings = async (settings) => {
  const response = await api.post('/settings', settings);
  return response.data;
};

export default api;
