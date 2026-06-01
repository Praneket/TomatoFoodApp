const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId:        { type: String, required: true, index: true },
  restaurantId:  { type: String, index: true },
  foodId:        String,
  orderId:       { type: String, required: true, unique: true },
  rating:        { type: Number, required: true, min: 1, max: 5 },
  comment:       String,
  images:        [String],
  sentiment:     { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
  sentimentScore: Number,
  isSpam:        { type: Boolean, default: false },
  isVerified:    { type: Boolean, default: true },
  helpfulCount:  { type: Number, default: 0 },
  reply:         { text: String, repliedAt: Date },
}, { timestamps: true });

reviewSchema.index({ restaurantId: 1, createdAt: -1 });
reviewSchema.index({ rating: -1 });

module.exports = mongoose.model('Review', reviewSchema);
