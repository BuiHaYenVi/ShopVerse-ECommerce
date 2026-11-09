import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach accessToken
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('shopverse_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle automatic token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // Standard response structure from NestJS TransformInterceptor: { statusCode, data, message }
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('shopverse_refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem('shopverse_access_token');
        localStorage.removeItem('shopverse_refresh_token');
        localStorage.removeItem('shopverse_user');
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newTokens = response.data?.data || response.data;
        const newAccessToken = newTokens.accessToken;
        const newRefreshToken = newTokens.refreshToken;

        localStorage.setItem('shopverse_access_token', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('shopverse_refresh_token', newRefreshToken);
        }

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('shopverse_access_token');
        localStorage.removeItem('shopverse_refresh_token');
        localStorage.removeItem('shopverse_user');
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Extract standardized message
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  },
);
