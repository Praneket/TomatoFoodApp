const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema({
  userId:        { type: String, required: true, unique: true },
  name:          String,
  phone:         String,
  email:         String,
  avatar:        String,
  vehicleType:   { type: String, enum: ['bike', 'scooter', 'bicycle', 'car'], default: 'bike' },
  vehicleNumber: String,
  licenseNumber: String,
  isVerified:    { type: Boolean, default: false },
  isOnline:      { type: Boolean, default: false },
  isAvailable:   { type: Boolean, default: true },
  currentLocation: { lat: Number, lng: Number, updatedAt: Date },
  rating:        { type: Number, default: 0 },
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings:   { type: Number, default: 0 },
  todayEarnings:   { type: Number, default: 0 },
  bankDetails: { accountNumber: String, ifscCode: String, upiId: String },
}, { timestamps: true });

deliveryPartnerSchema.index({ isOnline: 1, isAvailable: 1 });
deliveryPartnerSchema.index({ 'currentLocation.lat': 1, 'currentLocation.lng': 1 });

const deliverySchema = new mongoose.Schema({
  orderId:       { type: String, required: true, unique: true, index: true },
  partnerId:     { type: String, index: true },
  restaurantId:  String,
  restaurantLocation: { lat: Number, lng: Number, address: String },
  deliveryLocation:   { lat: Number, lng: Number, address: String },
  status: {
    type: String,
    enum: ['unassigned', 'assigned', 'accepted', 'rejected', 'picked_up', 'delivered', 'failed'],
    default: 'unassigned',
  },
  assignedAt:    Date,
  acceptedAt:    Date,
  pickedUpAt:    Date,
  deliveredAt:   Date,
  distance:      Number, // km
  estimatedTime: Number, // minutes
  earnings:      { type: Number, default: 0 },
  otp:           String, // delivery confirmation OTP
  route:         [{ lat: Number, lng: Number, timestamp: Date }],
}, { timestamps: true });

module.exports = {
  DeliveryPartner: mongoose.model('DeliveryPartner', deliveryPartnerSchema),
  Delivery: mongoose.model('Delivery', deliverySchema),
};
