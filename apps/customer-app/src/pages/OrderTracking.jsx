import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { orderAPI } from '../services/api';
import { FiPackage, FiCheck } from 'react-icons/fi';

const STEPS = [
  { key: 'pending',          label: 'Order Placed',       icon: '📋', desc: 'Your order has been received' },
  { key: 'confirmed',        label: 'Confirmed',          icon: '✅', desc: 'Restaurant confirmed your order' },
  { key: 'preparing',        label: 'Preparing',          icon: '👨‍🍳', desc: 'Chef is preparing your food' },
  { key: 'ready',            label: 'Ready',              icon: '📦', desc: 'Order is packed and ready' },
  { key: 'out_for_delivery', label: 'Out for Delivery',   icon: '🛵', desc: 'Delivery partner is on the way' },
  { key: 'delivered',        label: 'Delivered',          icon: '🎉', desc: 'Enjoy your meal!' },
];

const STATUS_INDEX = Object.fromEntries(STEPS.map((s, i) => [s.key, i]));

export default function OrderTracking() {
  const { orderId } = useParams();
  const { accessToken } = useSelector((s) => s.auth);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState(null);

  useEffect(() => {
    orderAPI.getById(orderId).then(({ data }) => {
      setOrder(data.data.order);
      setLoading(false);
    }).catch(() => setLoading(false));

    // Socket.IO for real-time updates
    const socket = io(import.meta.env.VITE_ORDER_SERVICE_URL || 'http://localhost:3006', {
      auth: { token: accessToken },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.emit('join:order', orderId);
    });

    socket.on('order:status_update', ({ status }) => {
      setOrder((prev) => prev ? { ...prev, status } : prev);
    });

    socket.on('driver:location_update', ({ lat, lng }) => {
      setDriverLocation({ lat, lng });
    });

    socket.on('order:delivered', () => {
      setOrder((prev) => prev ? { ...prev, status: 'delivered' } : prev);
    });

    return () => socket.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (loading) return (
    <div className="container-app py-20 text-center">
      <div className="text-4xl animate-bounce mb-4">🛵</div>
      <p className="text-gray-500">Loading order details...</p>
    </div>
  );

  if (!order) return (
    <div className="container-app py-20 text-center">
      <div className="text-6xl mb-4">📦</div>
      <h2 className="font-display text-2xl font-bold">Order not found</h2>
    </div>
  );

  const currentStep = STATUS_INDEX[order.status] ?? 0;
  const isDelivered = order.status === 'delivered';
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="container-app py-8 max-w-2xl">
      <div className="text-center mb-8">
        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: isDelivered ? 0 : Infinity }}
          className="text-6xl mb-3">{isDelivered ? '🎉' : isCancelled ? '❌' : '🛵'}</motion.div>
        <h1 className="font-display text-2xl font-bold">{isDelivered ? 'Order Delivered!' : isCancelled ? 'Order Cancelled' : 'Tracking Your Order'}</h1>
        <p className="text-gray-500 mt-1 text-sm">Order #{order.orderId}</p>
      </div>

      {/* Map Placeholder */}
      {!isDelivered && !isCancelled && (
        <div className="glass-card h-48 mb-6 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-dark-card dark:to-dark-border rounded-2xl overflow-hidden relative">
          <div className="text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="text-sm text-gray-500">Live map tracking</p>
            {driverLocation && (
              <p className="text-xs text-primary mt-1">Driver at: {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}</p>
            )}
          </div>
          {/* Animated delivery icon */}
          <motion.div animate={{ x: [-20, 20, -20] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-4 text-2xl">🛵</motion.div>
        </div>
      )}

      {/* Progress Steps */}
      {!isCancelled && (
        <div className="glass-card p-6 mb-6">
          <div className="space-y-4">
            {STEPS.map((step, i) => {
              const isDone = i <= currentStep;
              const isCurrent = i === currentStep;
              return (
                <motion.div key={step.key} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }} className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 transition-all duration-500 ${
                    isDone ? 'bg-primary shadow-glow' : 'bg-gray-100 dark:bg-dark-border'
                  } ${isCurrent ? 'ring-4 ring-primary/30' : ''}`}>
                    {isDone ? (i < currentStep ? <FiCheck className="w-5 h-5 text-white" /> : step.icon) : step.icon}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${isDone ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{step.label}</p>
                    {isCurrent && <p className="text-xs text-primary mt-0.5">{step.desc}</p>}
                  </div>
                  {isCurrent && (
                    <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Order Details */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><FiPackage className="text-primary" /> Order Details</h3>
        <div className="space-y-2 mb-4">
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">{item.name} x{item.quantity}</span>
              <span className="font-medium">₹{(item.price * item.quantity).toFixed(0)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 dark:border-dark-border pt-3 flex justify-between font-bold">
          <span>Total Paid</span>
          <span className="text-primary">₹{order.totalAmount?.toFixed(2)}</span>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          <p>Payment: {order.paymentMethod?.toUpperCase()}</p>
          <p>Estimated delivery: {order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleTimeString() : '30-45 mins'}</p>
        </div>
      </div>
    </div>
  );
}
