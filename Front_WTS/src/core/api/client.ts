import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8080/api';
export const API_ORIGIN = API_BASE_URL.replace('/api', '');

export const api = axios.create({
  baseURL: API_BASE_URL,
});

const PUBLIC_AUTH_PATHS = ['/auth/register', '/auth/login'];

function isPublicAuthRequest(url: string | undefined) {
  if (!url) return false;
  return PUBLIC_AUTH_PATHS.some((path) => url === path || url.endsWith(path));
}

api.interceptors.request.use((config) => {
  if (isPublicAuthRequest(config.url)) {
    config.headers.delete('Authorization');
    return config;
  }

  const token = localStorage.getItem('token');
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    config.headers.delete('Authorization');
  }

  return config;
});
