import axios from 'axios';

const getApiBaseUrl = () => {
  const customUrl = localStorage.getItem('vault_api_url');
  if (customUrl && customUrl.trim()) {
    return customUrl.trim();
  }
  return import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8000/api' : '/api');
};

const api = axios.create({
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatic Request Interceptor for Dynamic Base URL, User ID & Token
api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();

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
  const response = await api.post('/auth/login', {
    username_or_email: username,
    password: password
  });
  if (response.data && response.data.token) {
    localStorage.setItem('vault_token', response.data.token);
    localStorage.setItem('vault_user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const registerUser = async (username, email, password, full_name) => {
  const response = await api.post('/auth/register', {
    username,
    email,
    password,
    full_name
  });
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

export const logoutUser = () => {
  localStorage.removeItem('vault_token');
  localStorage.removeItem('vault_user');
};

// Document APIs
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

export const getJobStatus = async (jobId) => {
  const response = await api.get(`/documents/jobs/${jobId}`);
  return response.data;
};
export const checkJobStatus = getJobStatus;

export const fetchDocuments = async (params = {}) => {
  const response = await api.get('/documents', { params });
  return response.data;
};
export const listDocuments = fetchDocuments;

export const fetchDocumentDetails = async (documentId, pin = null) => {
  const headers = {};
  if (pin) {
    headers['X-Security-Pin'] = pin;
  }
  const response = await api.get(`/documents/${documentId}`, { headers });
  return response.data;
};
export const getDocument = fetchDocumentDetails;

export const getDocumentFileUrl = (documentId, pin = null) => {
  const token = localStorage.getItem('vault_token') || '';
  let url = `${API_BASE_URL}/documents/${documentId}/file?token=${encodeURIComponent(token)}`;
  if (pin) {
    url += `&pin=${encodeURIComponent(pin)}`;
  }
  return url;
};

export const renameDocument = async (documentId, newFilename) => {
  const response = await api.patch(`/documents/${documentId}/rename`, { new_filename: newFilename });
  return response.data;
};

export const updateDocumentTags = async (documentId, tags) => {
  const response = await api.patch(`/documents/${documentId}/tags`, { tags });
  return response.data;
};

export const toggleStarDocument = async (documentId) => {
  const response = await api.patch(`/documents/${documentId}/star`);
  return response.data;
};

export const deleteDocument = async (documentId) => {
  const response = await api.delete(`/documents/${documentId}`);
  return response.data;
};

export const verifyPin = async (pin) => {
  const response = await api.post('/documents/security/verify-pin', { pin });
  return response.data;
};

// Settings APIs
export const getSettings = async () => {
  const response = await api.get('/settings');
  return response.data;
};

export const updateSettings = async (settings) => {
  const response = await api.post('/settings', settings);
  return response.data;
};

// Vector & Full-Text Search APIs
export const searchDocumentsVector = async (query, limit = 10) => {
  const response = await api.post('/search', { query, limit });
  return response.data;
};
export const searchDocuments = searchDocumentsVector;

export const searchDocumentsText = async (query) => {
  const response = await api.get('/search/text', { params: { query } });
  return response.data;
};

export default api;
