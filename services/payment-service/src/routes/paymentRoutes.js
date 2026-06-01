const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/asyncHandler');
const { createStripeIntent, createRazorpayOrder, verifyRazorpay, confirmCOD, stripeWebhook, initiateRefund, getPaymentByOrder } = require('../controllers/paymentController');

const router = express.Router();

// Stripe webhook needs raw body - handled in server.js before json middleware
router.post('/webhook', stripeWebhook);

router.post('/stripe/create-intent',   authMiddleware, asyncHandler(createStripeIntent));
router.post('/razorpay/create-order',  authMiddleware, asyncHandler(createRazorpayOrder));
router.post('/razorpay/verify',        authMiddleware, asyncHandler(verifyRazorpay));
router.post('/cod/confirm',            authMiddleware, asyncHandler(confirmCOD));
router.post('/:orderId/refund',        authMiddleware, asyncHandler(initiateRefund));
router.get('/:orderId',                authMiddleware, asyncHandler(getPaymentByOrder));

module.exports = router;
