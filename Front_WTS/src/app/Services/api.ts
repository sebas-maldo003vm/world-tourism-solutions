import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8080/api';
export const API_ORIGIN = API_BASE_URL.replace('/api', '');

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {

  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
