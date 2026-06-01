const Stripe = require('stripe');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const { publishEvent } = require('../services/messageService');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
const razorpay = process.env.RAZORPAY_KEY_ID
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
  : null;

// POST /api/payments/stripe/create-intent
const createStripeIntent = async (req, res) => {
  const { orderId, amount, currency = 'inr' } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // paise
    currency,
    metadata: { orderId, userId: req.user.id },
    automatic_payment_methods: { enabled: true },
  });

  const payment = await Payment.create({
    orderId, userId: req.user.id, amount, currency: currency.toUpperCase(),
    method: 'stripe', status: 'processing',
    stripePaymentIntentId: paymentIntent.id,
    stripeClientSecret: paymentIntent.client_secret,
  });

  res.json({ success: true, data: { clientSecret: paymentIntent.client_secret, paymentId: payment._id } });
};

// POST /api/payments/razorpay/create-order
const createRazorpayOrder = async (req, res) => {
  if (!razorpay) {
    return res.status(503).json({ success: false, error: { message: 'Razorpay is not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment.', code: 'RAZORPAY_NOT_CONFIGURED' } });
  }
  const { orderId, amount } = req.body;

  const rzpOrder = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt: orderId,
    notes: { orderId, userId: req.user.id },
  });

  const payment = await Payment.create({
    orderId, userId: req.user.id, amount, currency: 'INR',
    method: 'razorpay', status: 'processing',
    razorpayOrderId: rzpOrder.id,
  });

  res.json({ success: true, data: { razorpayOrderId: rzpOrder.id, amount: rzpOrder.amount, currency: rzpOrder.currency, key: process.env.RAZORPAY_KEY_ID, paymentId: payment._id } });
};

// POST /api/payments/razorpay/verify
const verifyRazorpay = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    return res.status(400).json({ success: false, error: { message: 'Invalid payment signature', code: 'INVALID_SIGNATURE' } });
  }

  await Payment.findOneAndUpdate(
    { razorpayOrderId },
    { status: 'completed', razorpayPaymentId, razorpaySignature }
  );

  await publishEvent('payment.success', { orderId, paymentId: razorpayPaymentId, method: 'razorpay' });
  res.json({ success: true, message: 'Payment verified successfully' });
};

// POST /api/payments/cod/confirm
const confirmCOD = async (req, res) => {
  const { orderId } = req.body;

  await Payment.create({
    orderId, userId: req.user.id,
    amount: req.body.amount, currency: 'INR',
    method: 'cod', status: 'pending',
  });

  await publishEvent('payment.success', { orderId, method: 'cod', paymentId: `COD-${orderId}` });
  res.json({ success: true, message: 'COD order confirmed' });
};

// POST /api/payments/stripe/webhook
const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const { orderId } = intent.metadata;

    await Payment.findOneAndUpdate(
      { stripePaymentIntentId: intent.id },
      { status: 'completed' }
    );
    await publishEvent('payment.success', { orderId, paymentId: intent.id, method: 'stripe' });
  }

  if (event.type === 'payment_intent.payment_failed') {
    const intent = event.data.object;
    const { orderId } = intent.metadata;
    await Payment.findOneAndUpdate({ stripePaymentIntentId: intent.id }, { status: 'failed' });
    await publishEvent('payment.failed', { orderId, method: 'stripe' });
  }

  res.json({ received: true });
};

// POST /api/payments/:orderId/refund
const initiateRefund = async (req, res) => {
  const { reason } = req.body;
  const payment = await Payment.findOne({ orderId: req.params.orderId, status: 'completed' });
  if (!payment) return res.status(404).json({ success: false, error: { message: 'No completed payment found', code: 'PAYMENT_NOT_FOUND' } });

  let refundId;

  if (payment.method === 'stripe') {
    const refund = await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });
    refundId = refund.id;
  } else if (payment.method === 'razorpay') {
    const refund = await razorpay.payments.refund(payment.razorpayPaymentId, { amount: Math.round(payment.amount * 100) });
    refundId = refund.id;
  } else {
    refundId = `COD-REFUND-${Date.now()}`;
  }

  await Payment.findByIdAndUpdate(payment._id, {
    status: 'refunded', refundId, refundAmount: payment.amount, refundReason: reason, refundedAt: new Date(),
  });

  await publishEvent('refund.success', { orderId: req.params.orderId, refundId, amount: payment.amount });
  res.json({ success: true, message: 'Refund initiated successfully', data: { refundId } });
};

// GET /api/payments/:orderId
const getPaymentByOrder = async (req, res) => {
  const payment = await Payment.findOne({ orderId: req.params.orderId });
  if (!payment) return res.status(404).json({ success: false, error: { message: 'Payment not found' } });
  res.json({ success: true, data: { payment } });
};

module.exports = { createStripeIntent, createRazorpayOrder, verifyRazorpay, confirmCOD, stripeWebhook, initiateRefund, getPaymentByOrder };
