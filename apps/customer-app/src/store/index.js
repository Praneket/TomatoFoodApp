import { configureStore, createSlice } from '@reduxjs/toolkit';

// ── Auth Slice ──────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: JSON.parse(localStorage.getItem('tomato_user') || 'null'),
    accessToken: localStorage.getItem('tomato_access_token') || null,
    refreshToken: localStorage.getItem('tomato_refresh_token') || null,
    isLoading: false,
    error: null,
  },
  reducers: {
    setCredentials: (state, { payload }) => {
      state.user = payload.user;
      state.accessToken = payload.accessToken;
      state.refreshToken = payload.refreshToken;
      localStorage.setItem('tomato_user', JSON.stringify(payload.user));
      localStorage.setItem('tomato_access_token', payload.accessToken);
      localStorage.setItem('tomato_refresh_token', payload.refreshToken);
    },
    updateTokens: (state, { payload }) => {
      state.accessToken = payload.accessToken;
      state.refreshToken = payload.refreshToken;
      localStorage.setItem('tomato_access_token', payload.accessToken);
      localStorage.setItem('tomato_refresh_token', payload.refreshToken);
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem('tomato_user');
      localStorage.removeItem('tomato_access_token');
      localStorage.removeItem('tomato_refresh_token');
    },
    setLoading: (state, { payload }) => { state.isLoading = payload; },
    setError:   (state, { payload }) => { state.error = payload; },
  },
});

// ── Cart Slice ──────────────────────────────────────────────
const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    restaurantId: null,
    restaurantName: null,
    couponCode: null,
    subtotal: 0,
    deliveryFee: 49,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 0,
    isLoading: false,
  },
  reducers: {
    setCart: (state, { payload }) => Object.assign(state, payload),
    clearCartState: (state) => {
      state.items = [];
      state.restaurantId = null;
      state.restaurantName = null;
      state.couponCode = null;
      state.subtotal = 0;
      state.deliveryFee = 49;
      state.taxAmount = 0;
      state.discountAmount = 0;
      state.totalAmount = 0;
    },
    setCartLoading: (state, { payload }) => { state.isLoading = payload; },
  },
});

// ── UI Slice ────────────────────────────────────────────────
const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: localStorage.getItem('tomato_theme') || 'light',
    searchQuery: '',
    selectedCity: localStorage.getItem('tomato_city') || 'Mumbai',
    isAuthModalOpen: false,
    authModalTab: 'login',
  },
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('tomato_theme', state.theme);
    },
    setTheme: (state, { payload }) => {
      state.theme = payload;
      localStorage.setItem('tomato_theme', payload);
    },
    setSearchQuery:    (state, { payload }) => { state.searchQuery = payload; },
    setSelectedCity:   (state, { payload }) => { state.selectedCity = payload; localStorage.setItem('tomato_city', payload); },
    openAuthModal:     (state, { payload }) => { state.isAuthModalOpen = true; state.authModalTab = payload || 'login'; },
    closeAuthModal:    (state) => { state.isAuthModalOpen = false; },
  },
});

export const { setCredentials, updateTokens, logout, setLoading, setError } = authSlice.actions;
export const { setCart, clearCartState, setCartLoading } = cartSlice.actions;
export const { toggleTheme, setTheme, setSearchQuery, setSelectedCity, openAuthModal, closeAuthModal } = uiSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    cart: cartSlice.reducer,
    ui:   uiSlice.reducer,
  },
});
