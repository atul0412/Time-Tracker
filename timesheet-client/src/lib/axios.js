// lib/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Debugging logs (you can remove after debugging)
    // console.log('Axios Request Headers:', config.headers);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 500
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 500 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
