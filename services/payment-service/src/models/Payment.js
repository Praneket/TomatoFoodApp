const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  orderId:               { type: String, required: true, index: true },
  userId:                { type: String, required: true, index: true },
  amount:                { type: Number, required: true },
  currency:              { type: String, default: 'INR' },
  method:                { type: String, enum: ['stripe', 'razorpay', 'cod'], required: true },
  status:                { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'refunded'], default: 'pending' },
  stripePaymentIntentId: String,
  stripeClientSecret:    String,
  razorpayOrderId:       String,
  razorpayPaymentId:     String,
  razorpaySignature:     String,
  refundId:              String,
  refundAmount:          Number,
  refundReason:          String,
  refundedAt:            Date,
  metadata:              mongoose.Schema.Types.Mixed,
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
