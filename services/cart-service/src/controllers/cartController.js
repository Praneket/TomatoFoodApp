const { getRedis } = require('../services/redisService');

const CART_TTL = 7 * 24 * 60 * 60; // 7 days
const TAX_RATE = 0.05;

const COUPONS = {
  WELCOME10: { type: 'percent', value: 10, minOrder: 0, maxDiscount: 100 },
  FLAT50:    { type: 'flat',    value: 50, minOrder: 200, maxDiscount: 50 },
  SAVE20:    { type: 'percent', value: 20, minOrder: 300, maxDiscount: 200 },
  FREEDEL:   { type: 'delivery', value: 0, minOrder: 100, maxDiscount: 0 },
};

const getCartKey = (userId) => `cart:${userId}`;

// In-memory fallback when Redis is unavailable
const memStore = new Map();
const getRedisOrMem = () => {
  const redis = getRedis();
  if (redis) return redis;
  // Return a compatible shim using in-memory Map
  return {
    get:   (k)       => Promise.resolve(memStore.get(k) ?? null),
    setEx: (k, _t, v) => { memStore.set(k, v); return Promise.resolve(); },
    del:   (k)       => { memStore.delete(k); return Promise.resolve(); },
  };
};

const calculateTotals = (items, coupon = null) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal >= 500 ? 0 : 49;
  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;

  let discountAmount = 0;
  let freeDelivery = false;

  if (coupon) {
    if (coupon.type === 'percent') {
      discountAmount = Math.min(Math.round(subtotal * coupon.value / 100), coupon.maxDiscount);
    } else if (coupon.type === 'flat') {
      discountAmount = subtotal >= coupon.minOrder ? coupon.value : 0;
    } else if (coupon.type === 'delivery') {
      freeDelivery = subtotal >= coupon.minOrder;
    }
  }

  const finalDeliveryFee = freeDelivery ? 0 : deliveryFee;
  const totalAmount = Math.round((subtotal + finalDeliveryFee + taxAmount - discountAmount) * 100) / 100;

  return { subtotal, deliveryFee: finalDeliveryFee, taxAmount, discountAmount, totalAmount };
};

// GET /api/cart
const getCart = async (req, res) => {
  const redis = getRedisOrMem();
  const raw = await redis.get(getCartKey(req.user.id));
  const cart = raw ? JSON.parse(raw) : { items: [], restaurantId: null, couponCode: null };
  const totals = calculateTotals(cart.items, cart.coupon);
  res.json({ success: true, data: { ...cart, ...totals } });
};

// POST /api/cart/add
const addToCart = async (req, res) => {
  const { foodId, name, price, image, restaurantId, quantity = 1, customizations = [] } = req.body;
  const redis = getRedisOrMem();
  const key = getCartKey(req.user.id);

  const raw = await redis.get(key);
  const cart = raw ? JSON.parse(raw) : { items: [], restaurantId: null, couponCode: null, coupon: null };

  // Clear cart if switching restaurants
  if (cart.restaurantId && cart.restaurantId !== restaurantId && cart.items.length > 0) {
    return res.status(409).json({
      success: false,
      error: { message: 'Your cart has items from another restaurant. Clear cart to add from this restaurant.', code: 'DIFFERENT_RESTAURANT' },
      data: { currentRestaurantId: cart.restaurantId },
    });
  }

  cart.restaurantId = restaurantId;
  const existingIdx = cart.items.findIndex((i) => i.foodId === foodId && JSON.stringify(i.customizations) === JSON.stringify(customizations));

  if (existingIdx >= 0) {
    cart.items[existingIdx].quantity += quantity;
  } else {
    cart.items.push({ foodId, name, price, image, restaurantId, quantity, customizations });
  }

  await redis.setEx(key, CART_TTL, JSON.stringify(cart));
  const totals = calculateTotals(cart.items, cart.coupon);
  res.json({ success: true, data: { ...cart, ...totals } });
};

// PATCH /api/cart/update
const updateCartItem = async (req, res) => {
  const { foodId, quantity, customizations = [] } = req.body;
  const redis = getRedisOrMem();
  const key = getCartKey(req.user.id);

  const raw = await redis.get(key);
  if (!raw) return res.status(404).json({ success: false, error: { message: 'Cart not found' } });

  const cart = JSON.parse(raw);
  const idx = cart.items.findIndex((i) => i.foodId === foodId && JSON.stringify(i.customizations) === JSON.stringify(customizations));

  if (idx < 0) return res.status(404).json({ success: false, error: { message: 'Item not in cart' } });

  if (quantity <= 0) {
    cart.items.splice(idx, 1);
  } else {
    cart.items[idx].quantity = quantity;
  }

  if (cart.items.length === 0) cart.restaurantId = null;

  await redis.setEx(key, CART_TTL, JSON.stringify(cart));
  const totals = calculateTotals(cart.items, cart.coupon);
  res.json({ success: true, data: { ...cart, ...totals } });
};

// DELETE /api/cart/remove/:foodId
const removeFromCart = async (req, res) => {
  const redis = getRedisOrMem();
  const key = getCartKey(req.user.id);

  const raw = await redis.get(key);
  if (!raw) return res.status(404).json({ success: false, error: { message: 'Cart not found' } });

  const cart = JSON.parse(raw);
  cart.items = cart.items.filter((i) => i.foodId !== req.params.foodId);
  if (cart.items.length === 0) cart.restaurantId = null;

  await redis.setEx(key, CART_TTL, JSON.stringify(cart));
  const totals = calculateTotals(cart.items, cart.coupon);
  res.json({ success: true, data: { ...cart, ...totals } });
};

// DELETE /api/cart/clear
const clearCart = async (req, res) => {
  const redis = getRedisOrMem();
  await redis.del(getCartKey(req.user.id));
  res.json({ success: true, message: 'Cart cleared' });
};

// POST /api/cart/coupon
const applyCoupon = async (req, res) => {
  const { couponCode } = req.body;
  const redis = getRedisOrMem();
  const key = getCartKey(req.user.id);

  const raw = await redis.get(key);
  if (!raw) return res.status(404).json({ success: false, error: { message: 'Cart is empty' } });

  const cart = JSON.parse(raw);
  const coupon = COUPONS[couponCode?.toUpperCase()];

  if (!coupon) return res.status(400).json({ success: false, error: { message: 'Invalid coupon code', code: 'INVALID_COUPON' } });

  const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  if (subtotal < coupon.minOrder) {
    return res.status(400).json({ success: false, error: { message: `Minimum order ₹${coupon.minOrder} required for this coupon`, code: 'MIN_ORDER_NOT_MET' } });
  }

  cart.couponCode = couponCode.toUpperCase();
  cart.coupon = coupon;
  await redis.setEx(key, CART_TTL, JSON.stringify(cart));

  const totals = calculateTotals(cart.items, coupon);
  res.json({ success: true, message: 'Coupon applied successfully', data: { ...cart, ...totals } });
};

// DELETE /api/cart/coupon
const removeCoupon = async (req, res) => {
  const redis = getRedisOrMem();
  const key = getCartKey(req.user.id);
  const raw = await redis.get(key);
  if (!raw) return res.status(404).json({ success: false, error: { message: 'Cart not found' } });

  const cart = JSON.parse(raw);
  cart.couponCode = null;
  cart.coupon = null;
  await redis.setEx(key, CART_TTL, JSON.stringify(cart));

  const totals = calculateTotals(cart.items, null);
  res.json({ success: true, data: { ...cart, ...totals } });
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart, applyCoupon, removeCoupon };
