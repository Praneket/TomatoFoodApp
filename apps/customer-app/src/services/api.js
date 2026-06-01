import axios from 'axios';
import { store } from '../store';
import { updateTokens, logout } from '../store';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - attach access token
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 and refresh token
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      const refreshToken = store.getState().auth.refreshToken;
      if (!refreshToken) {
        store.dispatch(logout());
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data;
        store.dispatch(updateTokens({ accessToken, refreshToken: newRefresh }));
        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// API methods
export const authAPI = {
  register:       (data) => api.post('/api/auth/register', data),
  login:          (data) => api.post('/api/auth/login', data),
  logout:         (data) => api.post('/api/auth/logout', data),
  refresh:        (data) => api.post('/api/auth/refresh', data),
  verifyEmail:    (data) => api.post('/api/auth/verify-email', data),
  forgotPassword: (data) => api.post('/api/auth/forgot-password', data),
  resetPassword:  (data) => api.post('/api/auth/reset-password', data),
  getMe:          ()     => api.get('/api/auth/me'),
};

export const catalogAPI = {
  getFoods:      (params) => api.get('/api/catalog/foods', { params }),
  getFoodById:   (id)     => api.get(`/api/catalog/foods/${id}`),
  getCategories: ()       => api.get('/api/catalog/categories'),
  getTrending:   ()       => api.get('/api/catalog/trending'),
  search:        (q, p)   => api.get('/api/catalog/search', { params: { q, ...p } }),
};

export const restaurantAPI = {
  getAll:   (params) => api.get('/api/restaurants/public', { params }),
  getById:  (id)     => api.get(`/api/restaurants/public/${id}`),
};

export const cartAPI = {
  get:          ()     => api.get('/api/cart'),
  add:          (data) => api.post('/api/cart/add', data),
  update:       (data) => api.patch('/api/cart/update', data),
  remove:       (id)   => api.delete(`/api/cart/remove/${id}`),
  clear:        ()     => api.delete('/api/cart/clear'),
  applyCoupon:  (data) => api.post('/api/cart/coupon', data),
  removeCoupon: ()     => api.delete('/api/cart/coupon'),
};

export const orderAPI = {
  place:      (data)    => api.post('/api/orders', data),
  getAll:     (params)  => api.get('/api/orders', { params }),
  getById:    (id)      => api.get(`/api/orders/${id}`),
  cancel:     (id, data) => api.post(`/api/orders/${id}/cancel`, data),
  invoice:    (id)      => api.get(`/api/orders/${id}/invoice`, { responseType: 'blob' }),
};

export const paymentAPI = {
  createStripeIntent:  (data) => api.post('/api/payments/stripe/create-intent', data),
  createRazorpayOrder: (data) => api.post('/api/payments/razorpay/create-order', data),
  verifyRazorpay:      (data) => api.post('/api/payments/razorpay/verify', data),
  confirmCOD:          (data) => api.post('/api/payments/cod/confirm', data),
};

export const reviewAPI = {
  create:     (data) => api.post('/api/reviews', data),
  getByRestaurant: (id, p) => api.get(`/api/reviews/restaurant/${id}`, { params: p }),
  markHelpful: (id) => api.post(`/api/reviews/${id}/helpful`),
};

export const aiAPI = {
  chat:            (data) => api.post('/api/ai/chat', data),
  recommendations: (data) => api.post('/api/ai/recommendations/personalized', data),
  trending:        ()     => api.get('/api/ai/recommendations/trending'),
  search:          (q)    => api.get('/api/ai/search', { params: { q } }),
};

export const userAPI = {
  getProfile:    ()     => api.get('/api/users/profile'),
  updateProfile: (data) => api.put('/api/users/profile', data),
  getAddresses:  ()     => api.get('/api/users/addresses'),
  addAddress:    (data) => api.post('/api/users/addresses', data),
  deleteAddress: (id)   => api.delete(`/api/users/addresses/${id}`),
};

export default api;
