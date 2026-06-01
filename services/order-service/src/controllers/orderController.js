const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const Order = require('../models/Order');
const OrderSaga = require('../saga/OrderSaga');
const { publishEvent } = require('../services/messageService');
const { getIO } = require('../services/socketService');

// POST /api/orders
const placeOrder = async (req, res) => {
  const { restaurantId, restaurantName, items, deliveryAddress, paymentMethod, couponCode } = req.body;
  const userId = req.user.id;

  // Calculate pricing
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = subtotal > 500 ? 0 : 49;
  const taxAmount = Math.round(subtotal * 0.05 * 100) / 100;
  const discountAmount = 0; // coupon applied separately
  const totalAmount = subtotal + deliveryFee + taxAmount - discountAmount;

  const orderId = `TOM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const order = await Order.create({
    orderId, userId, restaurantId, restaurantName, items,
    deliveryAddress, paymentMethod, couponCode,
    subtotal, deliveryFee, taxAmount, discountAmount, totalAmount,
    statusHistory: [{ status: 'pending', note: 'Order placed by customer' }],
    estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000),
  });

  // Start saga
  const saga = new OrderSaga(order);
  saga.execute().catch((err) => console.error('Saga execution error:', err.message));

  // Real-time notification
  getIO()?.to(`user_${userId}`).emit('order:created', { orderId, status: 'pending', totalAmount });

  res.status(201).json({ success: true, message: 'Order placed successfully', data: { order } });
};

// GET /api/orders
const getMyOrders = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const filter = { userId: req.user.id };
  if (status) filter.status = status;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, data: { orders, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) } } });
};

// GET /api/orders/:orderId
const getOrderById = async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId });
  if (!order) return res.status(404).json({ success: false, error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' } });

  // Authorization check
  if (order.userId !== req.user.id && !['admin', 'super_admin', 'restaurant_owner', 'delivery_partner'].includes(req.user.role)) {
    return res.status(403).json({ success: false, error: { message: 'Forbidden', code: 'FORBIDDEN' } });
  }

  res.json({ success: true, data: { order } });
};

// PATCH /api/orders/:orderId/status
const updateOrderStatus = async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findOne({ orderId: req.params.orderId });
  if (!order) return res.status(404).json({ success: false, error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' } });

  const validTransitions = {
    pending:           ['confirmed', 'cancelled'],
    confirmed:         ['preparing', 'cancelled'],
    preparing:         ['ready'],
    ready:             ['picked_up'],
    picked_up:         ['out_for_delivery'],
    out_for_delivery:  ['delivered', 'cancelled'],
  };

  if (!validTransitions[order.status]?.includes(status)) {
    return res.status(400).json({ success: false, error: { message: `Cannot transition from ${order.status} to ${status}`, code: 'INVALID_TRANSITION' } });
  }

  order.status = status;
  order.statusHistory.push({ status, note, updatedBy: req.user.id });
  if (status === 'delivered') order.deliveredAt = new Date();
  if (status === 'cancelled') order.cancelledAt = new Date();
  await order.save();

  // Publish event & real-time update
  await publishEvent(`order.${status}`, { orderId: order.orderId, userId: order.userId, restaurantId: order.restaurantId, status });
  getIO()?.to(`order_${order.orderId}`).emit('order:status_update', { orderId: order.orderId, status, timestamp: new Date() });
  getIO()?.to(`user_${order.userId}`).emit('order:status_update', { orderId: order.orderId, status });

  res.json({ success: true, message: 'Order status updated', data: { order } });
};

// POST /api/orders/:orderId/cancel
const cancelOrder = async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findOne({ orderId: req.params.orderId, userId: req.user.id });
  if (!order) return res.status(404).json({ success: false, error: { message: 'Order not found', code: 'ORDER_NOT_FOUND' } });

  if (!['pending', 'confirmed'].includes(order.status)) {
    return res.status(400).json({ success: false, error: { message: 'Order cannot be cancelled at this stage', code: 'CANNOT_CANCEL' } });
  }

  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.cancellationReason = reason;
  order.statusHistory.push({ status: 'cancelled', note: reason, updatedBy: req.user.id });
  await order.save();

  await publishEvent('order.cancelled', { orderId: order.orderId, userId: order.userId, paymentMethod: order.paymentMethod, totalAmount: order.totalAmount });
  getIO()?.to(`user_${order.userId}`).emit('order:cancelled', { orderId: order.orderId });

  res.json({ success: true, message: 'Order cancelled successfully' });
};

// GET /api/orders/:orderId/invoice
const downloadInvoice = async (req, res) => {
  const order = await Order.findOne({ orderId: req.params.orderId, userId: req.user.id });
  if (!order) return res.status(404).json({ success: false, error: { message: 'Order not found' } });

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderId}.pdf`);
  doc.pipe(res);

  // Header
  doc.fontSize(24).fillColor('#ff6b35').text('🍅 TOMATO', 50, 50);
  doc.fontSize(10).fillColor('#666').text('Food Delivery Platform', 50, 80);
  doc.moveTo(50, 100).lineTo(550, 100).stroke('#ff6b35');

  // Invoice details
  doc.fontSize(18).fillColor('#333').text('INVOICE', 50, 120);
  doc.fontSize(10).fillColor('#666')
    .text(`Order ID: ${order.orderId}`, 50, 150)
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 50, 165)
    .text(`Status: ${order.status.toUpperCase()}`, 50, 180);

  // Items table
  doc.fontSize(12).fillColor('#333').text('Items', 50, 220);
  doc.moveTo(50, 235).lineTo(550, 235).stroke('#ddd');

  let y = 245;
  order.items.forEach((item) => {
    doc.fontSize(10).fillColor('#333')
      .text(item.name, 50, y)
      .text(`x${item.quantity}`, 300, y)
      .text(`₹${(item.price * item.quantity).toFixed(2)}`, 450, y);
    y += 20;
  });

  doc.moveTo(50, y + 5).lineTo(550, y + 5).stroke('#ddd');
  y += 20;
  doc.fontSize(10).fillColor('#666')
    .text(`Subtotal: ₹${order.subtotal.toFixed(2)}`, 350, y)
    .text(`Delivery Fee: ₹${order.deliveryFee.toFixed(2)}`, 350, y + 15)
    .text(`Tax (5%): ₹${order.taxAmount.toFixed(2)}`, 350, y + 30);

  doc.fontSize(12).fillColor('#ff6b35').text(`Total: ₹${order.totalAmount.toFixed(2)}`, 350, y + 50);
  doc.fontSize(9).fillColor('#999').text('Thank you for ordering with Tomato!', 50, y + 80);

  doc.end();
};

// GET /api/orders/restaurant/:restaurantId (for restaurant owners)
const getRestaurantOrders = async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const filter = { restaurantId: req.params.restaurantId };
  if (status) filter.status = status;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
    Order.countDocuments(filter),
  ]);

  res.json({ success: true, data: { orders, meta: { total, page: +page, totalPages: Math.ceil(total / limit) } } });
};

module.exports = { placeOrder, getMyOrders, getOrderById, updateOrderStatus, cancelOrder, downloadInvoice, getRestaurantOrders };
