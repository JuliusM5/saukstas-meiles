import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
});

// Add auth header interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Important: Remove content-type for FormData (let browser set it with boundary)
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  
  return config;
});

export { api };