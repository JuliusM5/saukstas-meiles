import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Add auth header interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export { api };