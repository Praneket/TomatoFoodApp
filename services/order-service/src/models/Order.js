const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  foodId:      { type: String, required: true },
  name:        { type: String, required: true },
  price:       { type: Number, required: true },
  quantity:    { type: Number, required: true, min: 1 },
  image:       String,
  customizations: [{ name: String, value: String, extraPrice: Number }],
});

const addressSchema = new mongoose.Schema({
  label:    String,
  line1:    { type: String, required: true },
  line2:    String,
  city:     { type: String, required: true },
  state:    String,
  pincode:  { type: String, required: true },
  lat:      Number,
  lng:      Number,
});

const statusHistorySchema = new mongoose.Schema({
  status:    String,
  timestamp: { type: Date, default: Date.now },
  note:      String,
  updatedBy: String,
});

const orderSchema = new mongoose.Schema({
  orderId:          { type: String, unique: true, required: true },
  userId:           { type: String, required: true, index: true },
  restaurantId:     { type: String, required: true, index: true },
  restaurantName:   String,
  deliveryPartnerId: String,

  items:            [orderItemSchema],
  deliveryAddress:  addressSchema,

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
    index: true,
  },
  statusHistory:    [statusHistorySchema],

  // Pricing
  subtotal:         { type: Number, required: true },
  deliveryFee:      { type: Number, default: 0 },
  taxAmount:        { type: Number, default: 0 },
  discountAmount:   { type: Number, default: 0 },
  totalAmount:      { type: Number, required: true },

  // Payment
  paymentMethod:    { type: String, enum: ['stripe', 'razorpay', 'cod'], required: true },
  paymentStatus:    { type: String, enum: ['pending', 'processing', 'completed', 'failed', 'refunded'], default: 'pending' },
  paymentId:        String,

  // Coupon
  couponCode:       String,
  couponDiscount:   Number,

  // Timing
  estimatedDelivery: Date,
  deliveredAt:      Date,
  cancelledAt:      Date,
  cancellationReason: String,

  // Invoice
  invoiceUrl:       String,

  // Saga state
  sagaState:        { type: String, default: 'ORDER_CREATED' },
}, { timestamps: true });

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ orderId: 1 });

module.exports = mongoose.model('Order', orderSchema);
