import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPackage, FiMapPin, FiDownload, FiRefreshCw, FiClock } from 'react-icons/fi';
import { orderAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  pending:          { color: 'status-pending',          icon: '⏳', label: 'Pending' },
  confirmed:        { color: 'status-confirmed',        icon: '✅', label: 'Confirmed' },
  preparing:        { color: 'status-preparing',        icon: '👨‍🍳', label: 'Preparing' },
  ready:            { color: 'status-ready',            icon: '📦', label: 'Ready' },
  out_for_delivery: { color: 'status-out_for_delivery', icon: '🛵', label: 'On the way' },
  delivered:        { color: 'status-delivered',        icon: '🎉', label: 'Delivered' },
  cancelled:        { color: 'status-cancelled',        icon: '❌', label: 'Cancelled' },
};

const ACTIVE_STATUSES = ['out_for_delivery', 'confirmed', 'preparing', 'ready'];

export default function Orders() {
  const navigate = useNavigate();
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orderAPI.getAll({ limit: 20 }),
    refetchInterval: 30000,
  });

  const orders = data?.data?.data?.orders || [];

  const downloadInvoice = async (orderId) => {
    try {
      const response = await orderAPI.invoice(orderId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `invoice-${orderId}.pdf`; a.click();
      window.URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download invoice'); }
  };

  if (isLoading) return (
    <div className="container-app py-20 text-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="text-4xl inline-block mb-4"
      >🍅</motion.div>
      <p className="text-gray-500 dark:text-gray-400">Loading your orders...</p>
    </div>
  );

  if (!orders.length) return (
    <div className="container-app py-24 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }}>
        <motion.div animate={{ y: [-8, 8, -8] }} transition={{ duration: 3, repeat: Infinity }} className="text-8xl mb-6 inline-block">📦</motion.div>
        <h2 className="font-display text-2xl font-bold mb-3 text-gray-900 dark:text-white">No orders yet</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Your order history will appear here</p>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/restaurants')} className="btn-primary px-8 py-3.5 text-base"
        >
          Order Now 🍽️
        </motion.button>
      </motion.div>
    </div>
  );

  return (
    <div className="container-app py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">My Orders 📦</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => refetch()}
          className="btn-ghost flex items-center gap-2 text-sm"
        >
          <motion.div animate={isFetching ? { rotate: 360 } : {}} transition={{ duration: 0.8, repeat: isFetching ? Infinity : 0, ease: 'linear' }}>
            <FiRefreshCw className="w-4 h-4" />
          </motion.div>
          Refresh
        </motion.button>
      </div>

      <div className="space-y-4">
        {orders.map((order, i) => {
          const cfg = STATUS_CONFIG[order.status] || { color: '', icon: '📋', label: order.status };
          const isActive = ACTIVE_STATUSES.includes(order.status);

          return (
            <motion.div key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-card p-6 ${isActive ? 'ring-2 ring-primary/20' : ''}`}
            >
              {/* Active order pulse indicator */}
              {isActive && (
                <div className="flex items-center gap-2 mb-4 text-primary text-sm font-semibold">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                  </span>
                  Live Order
                </div>
              )}

              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                    <span className="font-display font-bold text-lg text-gray-900 dark:text-white">{order.orderId}</span>
                    <span className={`badge ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <FiClock className="w-3.5 h-3.5" />
                    {order.restaurantName} • {format(new Date(order.createdAt), 'dd MMM yyyy, hh:mm a')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-primary">₹{order.totalAmount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Items preview */}
              <div className="flex flex-wrap gap-2 mb-5">
                {order.items?.slice(0, 4).map((item, j) => (
                  <span key={j} className="text-xs bg-gray-100 dark:bg-dark-muted text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-full font-medium">
                    {item.name} ×{item.quantity}
                  </span>
                ))}
                {order.items?.length > 4 && (
                  <span className="text-xs text-gray-400 px-3 py-1.5">+{order.items.length - 4} more</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100 dark:border-dark-border">
                {isActive && (
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/orders/${order.orderId}/track`)}
                    className="btn-primary text-sm px-4 py-2.5 rounded-xl flex items-center gap-2"
                  >
                    <FiMapPin className="w-4 h-4" /> Track Order
                  </motion.button>
                )}
                {order.status === 'delivered' && (
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={() => downloadInvoice(order.orderId)}
                    className="btn-secondary text-sm px-4 py-2.5 rounded-xl flex items-center gap-2"
                  >
                    <FiDownload className="w-4 h-4" /> Invoice
                  </motion.button>
                )}
                <button onClick={() => navigate(`/restaurants/${order.restaurantId}`)}
                  className="btn-ghost text-sm px-4 py-2.5 rounded-xl"
                >
                  Reorder 🔄
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
