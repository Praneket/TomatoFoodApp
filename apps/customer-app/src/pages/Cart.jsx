import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiTag, FiArrowRight, FiTruck, FiShield } from 'react-icons/fi';
import { cartAPI } from '../services/api';
import { setCart, clearCartState } from '../store';
import toast from 'react-hot-toast';

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector((s) => s.cart);
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    cartAPI.get().then(({ data }) => dispatch(setCart(data.data))).catch(() => {});
  }, [dispatch]);

  const updateQty = async (foodId, quantity) => {
    try {
      const { data } = await cartAPI.update({ foodId, quantity });
      dispatch(setCart(data.data));
    } catch { toast.error('Failed to update cart'); }
  };

  const removeItem = async (foodId) => {
    try {
      const { data } = await cartAPI.remove(foodId);
      dispatch(setCart(data.data));
      toast.success('Item removed');
    } catch { toast.error('Failed to remove item'); }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clear();
      dispatch(clearCartState());
      toast.success('Cart cleared');
    } catch { toast.error('Failed to clear cart'); }
  };

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await cartAPI.applyCoupon({ couponCode: couponInput });
      dispatch(setCart(data.data));
      toast.success('Coupon applied! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Invalid coupon');
    } finally { setCouponLoading(false); }
  };

  const removeCoupon = async () => {
    try {
      const { data } = await cartAPI.removeCoupon();
      dispatch(setCart(data.data));
      setCouponInput('');
      toast.success('Coupon removed');
    } catch { toast.error('Failed to remove coupon'); }
  };

  if (!cart.items?.length) return (
    <div className="container-app py-24 text-center">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring' }}>
        <motion.div animate={{ y: [-8, 8, -8] }} transition={{ duration: 3, repeat: Infinity }}
          className="text-8xl mb-6 inline-block"
        >🛒</motion.div>
        <h2 className="font-display text-2xl font-bold mb-3 text-gray-900 dark:text-white">Your cart is empty</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Add some delicious food to get started!</p>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/restaurants')} className="btn-primary px-8 py-3.5 text-base"
        >
          Browse Restaurants 🍽️
        </motion.button>
      </motion.div>
    </div>
  );

  return (
    <div className="container-app py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
          Your Cart 🛒
          <span className="ml-2 text-base font-normal text-gray-500">({cart.items.length} items)</span>
        </h1>
        <button onClick={clearCart} className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1.5 font-medium transition-colors">
          <FiTrash2 className="w-4 h-4" /> Clear all
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence>
            {cart.items.map((item) => (
              <motion.div key={item.foodId} layout
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25 }}
                className="glass-card p-4 flex items-center gap-4"
              >
                {/* Image */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-gray-700 dark:to-gray-600 flex-shrink-0 overflow-hidden">
                  {item.image
                    ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                  }
                </div>

                {/* Name & price */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{item.name}</h3>
                  <p className="text-primary font-bold mt-0.5">₹{item.price}</p>
                </div>

                {/* Qty controls */}
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.foodId, item.quantity - 1)} className="qty-btn qty-btn-minus">
                    <FiMinus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                  <button onClick={() => updateQty(item.foodId, item.quantity + 1)} className="qty-btn qty-btn-plus">
                    <FiPlus className="w-3 h-3" />
                  </button>
                </div>

                {/* Total & remove */}
                <div className="text-right min-w-[64px]">
                  <p className="font-bold text-gray-900 dark:text-white">₹{(item.price * item.quantity).toFixed(0)}</p>
                  <button onClick={() => removeItem(item.foodId)}
                    className="text-red-400 hover:text-red-500 mt-1 transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Coupon */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <FiTag className="w-4 h-4 text-primary" />
              </div>
              Apply Coupon
            </h3>
            {cart.couponCode ? (
              <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl px-4 py-3">
                <span className="text-green-700 dark:text-green-400 font-semibold text-sm">
                  ✅ <span className="font-bold">{cart.couponCode}</span> applied! Saved ₹{cart.discountAmount}
                </span>
                <button onClick={removeCoupon} className="text-red-500 text-sm hover:underline font-medium">Remove</button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input type="text" value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter coupon code"
                    className="input-field flex-1 text-sm uppercase tracking-wider"
                    onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                  />
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    onClick={applyCoupon} disabled={couponLoading}
                    className="btn-primary px-5 py-2.5 text-sm whitespace-nowrap rounded-xl"
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </motion.button>
                </div>
                <p className="text-xs text-gray-400 mt-2.5">
                  Try: <span className="font-mono bg-gray-100 dark:bg-dark-muted px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">WELCOME10</span>{' '}
                  <span className="font-mono bg-gray-100 dark:bg-dark-muted px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">FLAT50</span>{' '}
                  <span className="font-mono bg-gray-100 dark:bg-dark-muted px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">FREEDEL</span>
                </p>
              </>
            )}
          </motion.div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 sticky top-24"
          >
            <h2 className="font-display font-bold text-lg mb-6 text-gray-900 dark:text-white">Order Summary</h2>

            <div className="space-y-3 text-sm">
              {[
                { label: 'Subtotal',   value: `₹${cart.subtotal?.toFixed(2)}` },
                { label: 'Delivery Fee', value: cart.deliveryFee === 0 ? 'FREE' : `₹${cart.deliveryFee}`, green: cart.deliveryFee === 0 },
                { label: 'Tax (5%)',   value: `₹${cart.taxAmount?.toFixed(2)}` },
              ].map(({ label, value, green }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{label}</span>
                  <span className={green ? 'text-green-500 font-semibold' : 'text-gray-900 dark:text-white font-medium'}>{value}</span>
                </div>
              ))}

              {cart.discountAmount > 0 && (
                <div className="flex justify-between text-green-500">
                  <span>Discount 🎉</span>
                  <span className="font-semibold">-₹{cart.discountAmount?.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-dark-border pt-4 flex justify-between font-bold text-base">
                <span className="text-gray-900 dark:text-white">Total</span>
                <span className="text-primary text-xl">₹{cart.totalAmount?.toFixed(2)}</span>
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/checkout')}
              className="btn-primary w-full py-4 mt-6 text-base rounded-2xl flex items-center justify-center gap-2"
            >
              Proceed to Checkout <FiArrowRight />
            </motion.button>

            <div className="mt-5 space-y-2.5">
              {[
                { icon: FiShield, text: 'Secure 256-bit SSL checkout' },
                { icon: FiTruck,  text: 'Real-time order tracking' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-gray-400">
                  <Icon className="w-3.5 h-3.5 text-primary/60" />
                  {text}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
