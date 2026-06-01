const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  restaurantId:  { type: String, required: true, index: true },
  name:          { type: String, required: true },
  description:   String,
  price:         { type: Number, required: true },
  discountPrice: Number,
  category:      { type: String, required: true, index: true },
  image:         String,
  isVeg:         { type: Boolean, default: false },
  isAvailable:   { type: Boolean, default: true },
  isPopular:     { type: Boolean, default: false },
  isTrending:    { type: Boolean, default: false },
  tags:          [String],
  rating:        { type: Number, default: 0 },
  totalRatings:  { type: Number, default: 0 },
  totalOrders:   { type: Number, default: 0 },
  calories:      Number,
  allergens:     [String],
  preparationTime: Number,
  customizations: [{
    name: String,
    required: { type: Boolean, default: false },
    options: [{ name: String, extraPrice: { type: Number, default: 0 } }],
  }],
}, { timestamps: true });

foodSchema.index({ name: 'text', description: 'text', tags: 'text' });
foodSchema.index({ category: 1, isAvailable: 1 });
foodSchema.index({ totalOrders: -1 });
foodSchema.index({ rating: -1 });

module.exports = mongoose.model('Food', foodSchema);
