const mongoose = require('mongoose');

const timingSchema = new mongoose.Schema({
  day:   { type: String, enum: ['mon','tue','wed','thu','fri','sat','sun'] },
  open:  String, // "09:00"
  close: String, // "22:00"
  isClosed: { type: Boolean, default: false },
}, { _id: false });

const menuItemSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  description:   String,
  price:         { type: Number, required: true },
  discountPrice: Number,
  category:      { type: String, required: true },
  image:         String,
  isVeg:         { type: Boolean, default: false },
  isAvailable:   { type: Boolean, default: true },
  isPopular:     { type: Boolean, default: false },
  tags:          [String],
  customizations: [{
    name:    String,
    options: [{ name: String, extraPrice: { type: Number, default: 0 } }],
  }],
  preparationTime: Number, // minutes
  calories:        Number,
  allergens:       [String],
});

const restaurantSchema = new mongoose.Schema({
  ownerId:       { type: String, required: true, index: true },
  name:          { type: String, required: true },
  description:   String,
  cuisine:       [String],
  category:      { type: String, enum: ['restaurant', 'cafe', 'bakery', 'fast_food', 'fine_dining', 'cloud_kitchen'], default: 'restaurant' },
  images:        [String],
  logo:          String,
  coverImage:    String,

  address: {
    line1:   String,
    city:    { type: String, required: true },
    state:   String,
    pincode: String,
    lat:     Number,
    lng:     Number,
  },

  contact: {
    phone: String,
    email: String,
    website: String,
  },

  timings:       [timingSchema],
  menu:          [menuItemSchema],

  rating:        { type: Number, default: 0, min: 0, max: 5 },
  totalRatings:  { type: Number, default: 0 },
  deliveryTime:  { type: Number, default: 30 }, // minutes
  minOrder:      { type: Number, default: 0 },
  deliveryFee:   { type: Number, default: 49 },
  freeDeliveryAbove: Number,

  isOpen:        { type: Boolean, default: true },
  isVerified:    { type: Boolean, default: false },
  isActive:      { type: Boolean, default: true },
  isFeatured:    { type: Boolean, default: false },

  tags:          [String],
  totalOrders:   { type: Number, default: 0 },
  totalRevenue:  { type: Number, default: 0 },

  bankDetails: {
    accountNumber: String,
    ifscCode:      String,
    accountName:   String,
    upiId:         String,
  },
}, { timestamps: true });

restaurantSchema.index({ 'address.city': 1, isActive: 1 });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ rating: -1 });
restaurantSchema.index({ name: 'text', description: 'text', cuisine: 'text' });

module.exports = mongoose.model('Restaurant', restaurantSchema);
