import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { FiMapPin, FiCreditCard, FiTruck, FiCheck } from 'react-icons/fi';
import { orderAPI, paymentAPI, cartAPI } from '../services/api';
import { clearCartState } from '../store';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'stripe',   label: 'Credit / Debit Card',  icon: '💳', desc: 'Visa, Mastercard, Amex' },
  { id: 'razorpay', label: 'Razorpay',              icon: '🏦', desc: 'UPI, Netbanking, Wallets' },
  { id: 'cod',      label: 'Cash on Delivery',      icon: '💵', desc: 'Pay when delivered' },
];

export default function Checkout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cart = useSelector((s) => s.cart);

  const [address, setAddress] = useState({ line1: '', line2: '', city: '', state: '', pincode: '' });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Load Razorpay script once
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  const openRazorpay = (rzpData, order) => new Promise((resolve, reject) => {
    const options = {
      key: rzpData.key,
      amount: rzpData.amount,
      currency: rzpData.currency,
      name: 'Tomato Food Delivery',
      description: `Order #${order.orderId}`,
      order_id: rzpData.razorpayOrderId,
      handler: async (response) => {
        try {
          await paymentAPI.verifyRazorpay({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            orderId: order.orderId,
          });
          toast.success('Payment successful! 🎉');
          await cartAPI.clear();
          dispatch(clearCartState());
          navigate(`/orders/${order.orderId}/track`);
          resolve();
        } catch (err) {
          toast.error('Payment verification failed');
          reject(err);
        }
      },
      prefill: { name: '', email: '', contact: '' },
      theme: { color: '#ff6b35' },
      modal: {
        ondismiss: () => {
          toast.error('Payment cancelled');
          setLoading(false);
          reject(new Error('Payment cancelled'));
        },
      },
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  });

  useEffect(() => {
    if (!cart.items?.length) navigate('/cart');
  }, [cart.items, navigate]);

  const validate = () => {
    const e = {};
    if (!address.line1) e.line1 = 'Address is required';
    if (!address.city) e.city = 'City is required';
    if (!address.pincode || !/^\d{6}$/.test(address.pincode)) e.pincode = 'Valid 6-digit pincode required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const orderPayload = {
        restaurantId: cart.restaurantId,
        items: cart.items.map((i) => ({ foodId: i.foodId, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
        deliveryAddress: address,
        paymentMethod,
        couponCode: cart.couponCode,
      };

      const { data: orderData } = await orderAPI.place(orderPayload);
      const order = orderData.data.order;

      if (paymentMethod === 'stripe') {
        const { data: intentData } = await paymentAPI.createStripeIntent({ orderId: order.orderId, amount: order.totalAmount });
        void intentData;
        toast.success('Stripe payment coming soon! Treating as COD for now.');
      } else if (paymentMethod === 'razorpay') {
        const { data: rzpData } = await paymentAPI.createRazorpayOrder({ orderId: order.orderId, amount: order.totalAmount });
        await openRazorpay(rzpData.data, order);
        return; // openRazorpay handles navigation
      } else {
        await paymentAPI.confirmCOD({ orderId: order.orderId, amount: order.totalAmount });
        toast.success('Order placed! Pay on delivery 💵');
      }

      await cartAPI.clear();
      dispatch(clearCartState());
      navigate(`/orders/${order.orderId}/track`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to place order');
      setLoading(false);
    }
  };

  return (
    <div className="container-app py-8 max-w-4xl">
      <h1 className="font-display text-2xl font-bold mb-8 text-gray-900 dark:text-white">Checkout 🛒</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <div className="glass-card p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><FiMapPin className="text-primary" /> Delivery Address</h2>
            <div className="space-y-3">
              <div>
                <input type="text" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                  placeholder="House/Flat No., Street, Area" className={`input-field ${errors.line1 ? 'border-red-400' : ''}`} />
                {errors.line1 && <p className="text-red-500 text-xs mt-1">{errors.line1}</p>}
              </div>
              <input type="text" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                placeholder="Landmark (optional)" className="input-field" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input type="text" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="City" className={`input-field ${errors.city ? 'border-red-400' : ''}`} />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>
                <input type="text" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  placeholder="State" className="input-field" />
              </div>
              <div>
                <input type="text" value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                  placeholder="Pincode" maxLength={6} className={`input-field ${errors.pincode ? 'border-red-400' : ''}`} />
                {errors.pincode && <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="glass-card p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><FiCreditCard className="text-primary" /> Payment Method</h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <motion.label key={method.id} whileHover={{ scale: 1.01 }}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === method.id
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-dark-border hover:border-primary/50'
                  }`}>
                  <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id)} className="sr-only" />
                  <span className="text-2xl">{method.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{method.label}</p>
                    <p className="text-xs text-gray-500">{method.desc}</p>
                  </div>
                  {paymentMethod === method.id && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <FiCheck className="w-3 h-3 text-white" />
                    </div>
                  )}
                </motion.label>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="glass-card p-6 sticky top-24">
            <h2 className="font-display font-bold text-lg mb-4 text-gray-900 dark:text-white">Order Summary</h2>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {cart.items?.map((item) => (
                <div key={item.foodId} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300 truncate flex-1">{item.name} x{item.quantity}</span>
                  <span className="font-medium ml-2">₹{(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 dark:border-dark-border pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{cart.subtotal?.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Delivery</span>
                <span className={cart.deliveryFee === 0 ? 'text-green-500' : ''}>{cart.deliveryFee === 0 ? 'FREE' : `₹${cart.deliveryFee}`}</span>
              </div>
              <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>₹{cart.taxAmount?.toFixed(2)}</span></div>
              {cart.discountAmount > 0 && (
                <div className="flex justify-between text-green-500"><span>Discount</span><span>-₹{cart.discountAmount?.toFixed(2)}</span></div>
              )}
              <div className="flex justify-between font-bold text-base">
                <span className="text-gray-900 dark:text-white">Total</span><span className="text-primary text-lg">₹{cart.totalAmount?.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-xs text-orange-700 dark:text-orange-400 flex items-center gap-2">
              <FiTruck className="w-4 h-4 flex-shrink-0" />
              Estimated delivery: 30-45 minutes
            </div>

            <button onClick={handlePlaceOrder} disabled={loading}
              className="btn-primary w-full py-4 mt-4 text-base flex items-center justify-center gap-2">
              {loading ? (
                <><motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                  Processing...</>
              ) : `Place Order • ₹${cart.totalAmount?.toFixed(2)}`}
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">🔒 Secured by 256-bit SSL encryption</p>
          </div>
        </div>
      </div>
    </div>
  );
}
