import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useState, useEffect, Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Toaster, toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { FiHome, FiShoppingBag, FiList, FiBarChart2, FiSettings, FiMenu, FiX, FiLogOut, FiPlus, FiEdit2, FiTrash2, FiCheck, FiClock, FiTruck, FiDollarSign, FiUsers, FiStar } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ── API ──────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('admin_token');
const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((c) => { const t = getToken(); if (t) c.headers.Authorization = `Bearer ${t}`; return c; });

// ── AUTH ─────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', form);
      if (!['restaurant_owner', 'admin', 'super_admin'].includes(data.data.user.role)) {
        toast.error('Access denied. Restaurant owner or admin account required.');
        return;
      }
      localStorage.setItem('admin_token', data.data.accessToken);
      localStorage.setItem('admin_user', JSON.stringify(data.data.user));
      onLogin(data.data.user);
      toast.success(`Welcome, ${data.data.user.name}!`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍅</div>
          <h1 className="text-2xl font-bold text-white">Tomato Admin</h1>
          <p className="text-gray-400 text-sm mt-1">Restaurant Management Panel</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email" className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500" />
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Password" className="w-full bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500" />
          <button type="submit" disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

// ── SIDEBAR ──────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/dashboard', icon: FiHome,       label: 'Dashboard' },
  { to: '/orders',    icon: FiShoppingBag, label: 'Orders' },
  { to: '/menu',      icon: FiList,        label: 'Menu' },
  { to: '/analytics', icon: FiBarChart2,   label: 'Analytics' },
  { to: '/settings',  icon: FiSettings,    label: 'Settings' },
];

function Sidebar({ user, onLogout, isOpen, onClose }) {
  const location = useLocation();
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onClose} />}
      <aside className={`fixed left-0 top-0 h-full w-64 bg-gray-900 border-r border-gray-800 z-30 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍅</span>
            <div>
              <p className="font-bold text-white text-sm">Tomato Admin</p>
              <p className="text-gray-400 text-xs truncate">{user?.name}</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                location.pathname === to ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}>
              <Icon className="w-5 h-5" />{label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-6 left-4 right-4">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-900/30 hover:text-red-400 text-sm transition-all">
            <FiLogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}

// ── DASHBOARD ────────────────────────────────────────────────
function Dashboard() {
  const { data } = useQuery({ queryKey: ['restaurant-analytics'], queryFn: () => api.get('/api/analytics/restaurant/my?period=30d').then(r => r.data.data) });
  const stats = [
    { label: "Today's Orders", value: '24', icon: FiShoppingBag, color: 'text-blue-400', bg: 'bg-blue-900/30' },
    { label: "Today's Revenue", value: '₹8,450', icon: FiDollarSign, color: 'text-green-400', bg: 'bg-green-900/30' },
    { label: 'Avg Rating', value: '4.5 ⭐', icon: FiStar, color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
    { label: 'Active Orders', value: '7', icon: FiTruck, color: 'text-orange-400', bg: 'bg-orange-900/30' },
  ];

  const revenueData = data?.revenue?.slice(-7) || Array(7).fill(0).map((_, i) => ({ _id: `Day ${i+1}`, revenue: Math.random() * 5000 + 2000, orders: Math.floor(Math.random() * 30 + 10) }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard 📊</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-gray-400 text-sm mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-4">Revenue (Last 7 Days)</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="_id" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
            <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
            <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── ORDERS ───────────────────────────────────────────────────
function Orders() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['restaurant-orders'],
    queryFn: () => api.get('/api/orders/restaurant/my').then(r => r.data.data.orders),
    refetchInterval: 15000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }) => api.patch(`/api/orders/${orderId}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries(['restaurant-orders']); toast.success('Order status updated'); },
    onError: () => toast.error('Failed to update status'),
  });

  const STATUS_COLORS = {
    pending: 'bg-yellow-900/30 text-yellow-400 border-yellow-800',
    confirmed: 'bg-blue-900/30 text-blue-400 border-blue-800',
    preparing: 'bg-orange-900/30 text-orange-400 border-orange-800',
    ready: 'bg-purple-900/30 text-purple-400 border-purple-800',
    out_for_delivery: 'bg-indigo-900/30 text-indigo-400 border-indigo-800',
    delivered: 'bg-green-900/30 text-green-400 border-green-800',
    cancelled: 'bg-red-900/30 text-red-400 border-red-800',
  };

  const NEXT_STATUS = { pending: 'confirmed', confirmed: 'preparing', preparing: 'ready' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Orders 📦</h1>
        <span className="text-gray-400 text-sm">Auto-refreshes every 15s</span>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading orders...</div>
      ) : !data?.length ? (
        <div className="text-center py-20"><div className="text-5xl mb-4">📭</div><p className="text-gray-400">No orders yet</p></div>
      ) : (
        <div className="space-y-3">
          {data.map((order) => (
            <motion.div key={order._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-gray-800 rounded-2xl p-5 border border-gray-700">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-bold text-white">{order.orderId}</p>
                  <p className="text-gray-400 text-sm">{order.items?.length} items • ₹{order.totalAmount}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${STATUS_COLORS[order.status] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {order.items?.slice(0, 3).map((item, i) => (
                  <span key={i} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">{item.name} x{item.quantity}</span>
                ))}
              </div>
              {NEXT_STATUS[order.status] && (
                <button onClick={() => updateStatus.mutate({ orderId: order.orderId, status: NEXT_STATUS[order.status] })}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
                  <FiCheck className="w-4 h-4" /> Mark as {NEXT_STATUS[order.status]}
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MENU MANAGEMENT ──────────────────────────────────────────
function Menu() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: 'Main Course', isVeg: false });

  const { data: restaurant } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn: () => api.get('/api/restaurants/my').then(r => r.data.data.restaurant),
  });

  const addItem = useMutation({
    mutationFn: (item) => api.post(`/api/restaurants/${restaurant?._id}/menu`, item),
    onSuccess: () => { qc.invalidateQueries(['my-restaurant']); setShowForm(false); setForm({ name: '', description: '', price: '', category: 'Main Course', isVeg: false }); toast.success('Menu item added!'); },
    onError: () => toast.error('Failed to add item'),
  });

  const deleteItem = useMutation({
    mutationFn: (itemId) => api.delete(`/api/restaurants/${restaurant?._id}/menu/${itemId}`),
    onSuccess: () => { qc.invalidateQueries(['my-restaurant']); toast.success('Item deleted'); },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Menu Management 🍽️</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm flex items-center gap-2 transition-colors">
          <FiPlus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h3 className="font-semibold text-white mb-4">Add Menu Item</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'name', placeholder: 'Item Name', type: 'text' },
                { key: 'price', placeholder: 'Price (₹)', type: 'number' },
                { key: 'category', placeholder: 'Category', type: 'text' },
              ].map(({ key, placeholder, type }) => (
                <input key={key} type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder={placeholder} className="bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 text-sm" />
              ))}
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description" rows={2} className="bg-gray-700 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 text-sm sm:col-span-2" />
              <label className="flex items-center gap-2 text-gray-300 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isVeg} onChange={(e) => setForm({ ...form, isVeg: e.target.checked })} className="accent-green-500" />
                Vegetarian
              </label>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => addItem.mutate({ ...form, price: parseFloat(form.price), isAvailable: true })}
                disabled={addItem.isPending} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl text-sm transition-colors">
                {addItem.isPending ? 'Adding...' : 'Add Item'}
              </button>
              <button onClick={() => setShowForm(false)} className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-xl text-sm transition-colors">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {restaurant?.menu?.map((item) => (
          <motion.div key={item._id} layout className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-sm border-2 ${item.isVeg ? 'border-green-500' : 'border-red-500'}`}>
                    <span className={`block w-1.5 h-1.5 rounded-full m-auto mt-0.5 ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                  </span>
                  <h3 className="font-semibold text-white text-sm">{item.name}</h3>
                </div>
                <p className="text-gray-400 text-xs mt-1 line-clamp-2">{item.description}</p>
              </div>
              <button onClick={() => deleteItem.mutate(item._id)} className="text-red-400 hover:text-red-300 flex-shrink-0">
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-orange-400 font-bold">₹{item.price}</span>
              <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded-full">{item.category}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── ANALYTICS ────────────────────────────────────────────────
function Analytics() {
  const { data } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/api/analytics/restaurant/my?period=30d').then(r => r.data.data),
  });

  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Analytics 📈</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h3 className="font-semibold text-white mb-4">Daily Revenue</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data?.revenue || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="_id" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
              <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
              <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h3 className="font-semibold text-white mb-4">Top Items</h3>
          {data?.topItems?.slice(0, 5).map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
              <span className="text-gray-300 text-sm">{item._id}</span>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-xs">{item.count} orders</span>
                <span className="text-orange-400 font-semibold text-sm">₹{item.revenue?.toFixed(0)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── SETTINGS ─────────────────────────────────────────────────
function Settings() {
  const qc = useQueryClient();
  const { data: restaurant } = useQuery({ queryKey: ['my-restaurant'], queryFn: () => api.get('/api/restaurants/my').then(r => r.data.data.restaurant) });

  const toggleOpen = useMutation({
    mutationFn: () => api.patch(`/api/restaurants/${restaurant?._id}/toggle-open`),
    onSuccess: () => { qc.invalidateQueries(['my-restaurant']); toast.success('Restaurant status updated'); },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings ⚙️</h1>
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <h3 className="font-semibold text-white mb-4">Restaurant Status</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">{restaurant?.name}</p>
            <p className="text-gray-400 text-sm">{restaurant?.isOpen ? '🟢 Currently Open' : '🔴 Currently Closed'}</p>
          </div>
          <button onClick={() => toggleOpen.mutate()}
            className={`px-6 py-2 rounded-xl font-semibold text-sm transition-colors ${restaurant?.isOpen ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}>
            {restaurant?.isOpen ? 'Close Restaurant' : 'Open Restaurant'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30000, retry: 1 } } });

function AdminApp() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('admin_user')); } catch { return null; } });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
    toast.success('Logged out');
  };

  if (!user) return <Login onLogin={setUser} />;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-900 text-white">
        <Sidebar user={user} onLogout={handleLogout} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:ml-64">
          {/* Top bar */}
          <div className="sticky top-0 z-10 bg-gray-900/90 backdrop-blur border-b border-gray-800 px-6 py-4 flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white">
              <FiMenu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3 ml-auto">
              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-gray-300 hidden sm:block">{user?.name}</span>
            </div>
          </div>

          {/* Content */}
          <main className="p-6">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/orders"    element={<Orders />} />
              <Route path="/menu"      element={<Menu />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings"  element={<Settings />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminApp />
      <Toaster position="top-right" toastOptions={{ style: { background: '#1F2937', color: '#fff', border: '1px solid #374151' } }} />
    </QueryClientProvider>
  );
}
