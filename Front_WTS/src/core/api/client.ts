import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8080/api';
export const API_ORIGIN = API_BASE_URL.replace('/api', '');

export const api = axios.create({
  baseURL: API_BASE_URL,
});

const TOKEN_KEY = 'token';
const PUBLIC_AUTH_PATHS = ['/auth/register', '/auth/login', '/auth/reset-password'];

function isPublicAuthRequest(url: string | undefined) {
  if (!url) return false;
  return PUBLIC_AUTH_PATHS.some((path) => url === path || url.endsWith(path));
}

/**
 * Session token lives in localStorage under "token".
 * The request interceptor attaches it as `Authorization: Bearer <token>`
 * except on public auth calls, which must not reuse a stale token.
 * A 401 from any other call means the token is missing, expired, or invalid:
 * storage is cleared and the browser is sent to /login.
 */
function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('user');
  localStorage.removeItem('role');
}

function redirectToLogin() {
  if (window.location.pathname === '/login') {
    return;
  }
  window.location.assign('/login');
}

api.interceptors.request.use((config) => {
  if (isPublicAuthRequest(config.url)) {
    config.headers.delete('Authorization');
    return config;
  }

  const token = localStorage.getItem(TOKEN_KEY);
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    config.headers.delete('Authorization');
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Failed login/register must stay on the form and must not wipe a session
    // that was never established by this request.
    if (isPublicAuthRequest(error.config?.url)) {
      return Promise.reject(error);
    }

    clearSession();
    redirectToLogin();
    return Promise.reject(error);
  },
);
