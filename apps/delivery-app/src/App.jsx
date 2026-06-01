import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  FiHome, FiPackage, FiDollarSign, FiClock, FiLogOut,
  FiMapPin, FiPhone, FiCheck, FiX, FiNavigation, FiUser,
  FiToggleLeft, FiToggleRight, FiStar, FiTruck,
} from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ORDER_URL = import.meta.env.VITE_ORDER_SERVICE_URL || 'http://localhost:3006';

const getToken = () => localStorage.getItem('delivery_token');
const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use((c) => {
  const t = getToken();
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

// ── LOGIN ─────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', form);
      if (data.data.user.role !== 'delivery_partner') {
        toast.error('Access denied. Delivery partner account required.');
        return;
      }
      localStorage.setItem('delivery_token', data.data.accessToken);
      localStorage.setItem('delivery_user', JSON.stringify(data.data.user));
      onLogin(data.data.user);
      toast.success(`Welcome, ${data.data.user.name}!`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-gray-900 rounded-2xl p-8 border border-gray-800">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🛵</div>
          <h1 className="text-2xl font-bold text-white font-display">Tomato Delivery</h1>
          <p className="text-gray-400 text-sm mt-1">Partner Portal</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email" required
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500" />
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Password" required
            className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500" />
          <button type="submit" disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-gray-500 text-xs mt-6">
          Register as delivery partner via the customer app
        </p>
      </motion.div>
    </div>
  );
}

// ── BOTTOM NAV ────────────────────────────────────────────────
const NAV = [
  { id: 'home',     icon: FiHome,       label: 'Home' },
  { id: 'active',   icon: FiTruck,      label: 'Active' },
  { id: 'earnings', icon: FiDollarSign, label: 'Earnings' },
  { id: 'history',  icon: FiClock,      label: 'History' },
];

function BottomNav({ tab, setTab }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex z-50">
      {NAV.map(({ id, icon: Icon, label }) => (
        <button key={id} onClick={() => setTab(id)}
          className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
            tab === id ? 'text-orange-500' : 'text-gray-500 hover:text-gray-300'
          }`}>
          <Icon className="w-5 h-5" />
          {label}
        </button>
      ))}
    </nav>
  );
}

// ── HOME / DASHBOARD ─────────────────────────────────────────
function Home({ user, isOnline, setIsOnline }) {
  const { data: stats } = useQuery({
    queryKey: ['delivery-stats'],
    queryFn: () => api.get('/api/delivery/partner/stats').then(r => r.data.data).catch(() => null),
  });

  const toggleOnline = async () => {
    try {
      await api.patch('/api/delivery/partner/status', { isOnline: !isOnline });
      setIsOnline(!isOnline);
      toast.success(isOnline ? 'You are now offline' : 'You are now online!');
    } catch {
      // Toggle locally if API not available
      setIsOnline(!isOnline);
      toast.success(isOnline ? 'You are now offline' : 'You are now online!');
    }
  };

  return (
    <div className="space-y-5">
      {/* Status Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-orange-100 text-sm">Good {new Date().getHours() < 12 ? 'Morning' : 'Evening'}!</p>
            <h2 className="text-xl font-bold">{user?.name}</h2>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
            🛵
          </div>
        </div>
        <button onClick={toggleOnline}
          className={`flex items-center gap-3 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
            isOnline ? 'bg-white text-orange-500' : 'bg-white/20 text-white border border-white/30'
          }`}>
          {isOnline ? <FiToggleRight className="w-5 h-5" /> : <FiToggleLeft className="w-5 h-5" />}
          {isOnline ? '🟢 Online - Accepting Orders' : '🔴 Offline'}
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "Today's Earnings", value: `₹${stats?.todayEarnings || 0}`, icon: FiDollarSign, color: 'text-green-400' },
          { label: "Today's Deliveries", value: stats?.todayDeliveries || 0, icon: FiPackage, color: 'text-blue-400' },
          { label: 'Total Earnings', value: `₹${stats?.totalEarnings || 0}`, icon: FiDollarSign, color: 'text-orange-400' },
          { label: 'Rating', value: `${stats?.rating || '4.8'} ⭐`, icon: FiStar, color: 'text-yellow-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <motion.div key={label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="card">
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-gray-400 text-xs mt-1">{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Status message */}
      {isOnline && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="card border-orange-500/30 text-center py-8">
          <div className="text-4xl mb-3 animate-bounce">🛵</div>
          <p className="text-white font-semibold">Waiting for orders...</p>
          <p className="text-gray-400 text-sm mt-1">You'll be notified when a new order arrives</p>
        </motion.div>
      )}
    </div>
  );
}

// ── ACTIVE DELIVERY ───────────────────────────────────────────
function ActiveDelivery({ socket }) {
  const qc = useQueryClient();
  const [newOrder, setNewOrder] = useState(null);

  const { data: activeDelivery } = useQuery({
    queryKey: ['active-delivery'],
    queryFn: () => api.get('/api/delivery/partner/active').then(r => r.data.data).catch(() => null),
    refetchInterval: 10000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ deliveryId, status }) => api.patch(`/api/delivery/${deliveryId}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries(['active-delivery']); toast.success('Status updated!'); },
    onError: () => toast.error('Failed to update status'),
  });

  // Listen for new order assignments via socket
  useEffect(() => {
    if (!socket) return;
    socket.on('delivery:assigned', (data) => {
      setNewOrder(data);
      toast('🛵 New delivery assigned!', { icon: '📦' });
    });
    return () => socket.off('delivery:assigned');
  }, [socket]);

  const STEPS = [
    { status: 'picked_up', label: 'Picked Up from Restaurant', icon: '🏪' },
    { status: 'out_for_delivery', label: 'Out for Delivery', icon: '🛵' },
    { status: 'delivered', label: 'Mark as Delivered', icon: '✅' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Active Delivery</h2>

      {/* New order notification */}
      <AnimatePresence>
        {newOrder && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="card border-orange-500 bg-orange-500/10">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-orange-400">📦 New Order!</h3>
              <button onClick={() => setNewOrder(null)} className="text-gray-400 hover:text-white"><FiX /></button>
            </div>
            <p className="text-white text-sm">Order #{newOrder.orderId}</p>
            <p className="text-gray-400 text-xs mt-1">Pickup: {newOrder.restaurantName}</p>
            <p className="text-gray-400 text-xs">Deliver to: {newOrder.deliveryAddress?.city}</p>
            <p className="text-green-400 font-semibold mt-2">Earnings: ₹{newOrder.deliveryFee || 50}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {activeDelivery ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Order #{activeDelivery.orderId}</h3>
              <span className="text-xs bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full border border-orange-500/30">
                {activeDelivery.status?.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Pickup */}
            <div className="flex items-start gap-3 mb-4 p-3 bg-gray-800 rounded-xl">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FiMapPin className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Pickup</p>
                <p className="text-white text-sm font-medium">{activeDelivery.restaurantName || 'Restaurant'}</p>
              </div>
            </div>

            {/* Dropoff */}
            <div className="flex items-start gap-3 mb-4 p-3 bg-gray-800 rounded-xl">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <FiNavigation className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Deliver to</p>
                <p className="text-white text-sm font-medium">
                  {activeDelivery.deliveryAddress?.line1}, {activeDelivery.deliveryAddress?.city}
                </p>
              </div>
            </div>

            {/* Customer contact */}
            <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl mb-4">
              <FiPhone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300 text-sm">Customer: {activeDelivery.userPhone || 'N/A'}</span>
            </div>

            {/* Earnings */}
            <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-xl border border-green-500/20 mb-4">
              <span className="text-gray-300 text-sm">Your Earnings</span>
              <span className="text-green-400 font-bold">₹{activeDelivery.deliveryFee || 50}</span>
            </div>

            {/* Action buttons */}
            <div className="space-y-2">
              {STEPS.map(({ status, label, icon }) => (
                activeDelivery.status !== status && activeDelivery.status !== 'delivered' && (
                  <button key={status}
                    onClick={() => updateStatus.mutate({ deliveryId: activeDelivery._id, status })}
                    disabled={updateStatus.isPending}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50">
                    <span>{icon}</span> {label}
                  </button>
                )
              ))}
              {activeDelivery.status === 'delivered' && (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">🎉</div>
                  <p className="text-green-400 font-semibold">Delivery Completed!</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-400">No active delivery</p>
          <p className="text-gray-500 text-sm mt-1">Go online to receive orders</p>
        </div>
      )}
    </div>
  );
}

// ── EARNINGS ─────────────────────────────────────────────────
function Earnings() {
  const { data } = useQuery({
    queryKey: ['earnings'],
    queryFn: () => api.get('/api/delivery/partner/earnings').then(r => r.data.data).catch(() => ({
      today: 0, week: 0, month: 0, total: 0, deliveries: [],
    })),
  });

  const periods = [
    { label: 'Today', value: `₹${data?.today || 0}`, color: 'text-green-400' },
    { label: 'This Week', value: `₹${data?.week || 0}`, color: 'text-blue-400' },
    { label: 'This Month', value: `₹${data?.month || 0}`, color: 'text-orange-400' },
    { label: 'Total', value: `₹${data?.total || 0}`, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-white">Earnings</h2>
      <div className="grid grid-cols-2 gap-4">
        {periods.map(({ label, value, color }) => (
          <div key={label} className="card">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-gray-400 text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h3 className="font-semibold text-white mb-4">Recent Deliveries</h3>
        {data?.deliveries?.length ? (
          <div className="space-y-3">
            {data.deliveries.slice(0, 10).map((d, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">#{d.orderId}</p>
                  <p className="text-gray-400 text-xs">{new Date(d.createdAt).toLocaleDateString()}</p>
                </div>
                <span className="text-green-400 font-semibold">₹{d.deliveryFee || 50}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center py-4">No deliveries yet</p>
        )}
      </div>
    </div>
  );
}

// ── HISTORY ───────────────────────────────────────────────────
function History() {
  const { data, isLoading } = useQuery({
    queryKey: ['delivery-history'],
    queryFn: () => api.get('/api/delivery/partner/history').then(r => r.data.data?.deliveries || []).catch(() => []),
  });

  const STATUS_COLOR = {
    delivered: 'text-green-400',
    cancelled: 'text-red-400',
    failed: 'text-red-400',
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Delivery History</h2>
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : !data?.length ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-400">No delivery history yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((d, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white">#{d.orderId}</p>
                  <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                    <FiMapPin className="w-3 h-3" />
                    {d.deliveryAddress?.city || 'N/A'}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {d.deliveredAt ? new Date(d.deliveredAt).toLocaleString() : new Date(d.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold">₹{d.deliveryFee || 50}</p>
                  <p className={`text-xs mt-1 ${STATUS_COLOR[d.status] || 'text-gray-400'}`}>
                    {d.status}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30000, retry: 1 } } });

function DeliveryApp() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('delivery_user')); } catch { return null; } });
  const [tab, setTab] = useState('home');
  const [isOnline, setIsOnline] = useState(false);
  const [socket, setSocket] = useState(null);

  // Connect socket when logged in
  useEffect(() => {
    if (!user) return;
    const token = getToken();
    if (!token) return;

    const s = io(ORDER_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    s.on('connect', () => console.log('Socket connected'));
    s.on('connect_error', (err) => console.warn('Socket error:', err.message));
    setSocket(s);
    return () => s.disconnect();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('delivery_token');
    localStorage.removeItem('delivery_user');
    socket?.disconnect();
    setUser(null);
    toast.success('Logged out');
  };

  if (!user) return <Login onLogin={setUser} />;

  const TABS = {
    home:     <Home user={user} isOnline={isOnline} setIsOnline={setIsOnline} />,
    active:   <ActiveDelivery socket={socket} />,
    earnings: <Earnings />,
    history:  <History />,
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-950/90 backdrop-blur border-b border-gray-800 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛵</span>
          <div>
            <p className="font-bold text-white text-sm font-display">Tomato Delivery</p>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
              <span className="text-xs text-gray-400">{isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </div>
        </div>
        <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition-colors p-2">
          <FiLogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <main className="px-4 py-5">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            {TABS[tab]}
          </motion.div>
        </AnimatePresence>
      </main>

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DeliveryApp />
    </QueryClientProvider>
  );
}
