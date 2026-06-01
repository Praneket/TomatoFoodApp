const Review = require('../models/Review');

// Simple keyword-based sentiment analysis (replace with AI service call in production)
const analyzeSentiment = (text) => {
  if (!text) return { sentiment: 'neutral', score: 0 };
  const lower = text.toLowerCase();
  const positive = ['great', 'excellent', 'amazing', 'delicious', 'love', 'perfect', 'best', 'wonderful', 'fantastic', 'good', 'tasty', 'fresh'];
  const negative = ['bad', 'terrible', 'awful', 'horrible', 'worst', 'disgusting', 'cold', 'late', 'wrong', 'poor', 'disappointing', 'never'];

  const posScore = positive.filter((w) => lower.includes(w)).length;
  const negScore = negative.filter((w) => lower.includes(w)).length;

  if (posScore > negScore) return { sentiment: 'positive', score: posScore / (posScore + negScore) };
  if (negScore > posScore) return { sentiment: 'negative', score: -(negScore / (posScore + negScore)) };
  return { sentiment: 'neutral', score: 0 };
};

// Simple spam detection
const isSpam = (text) => {
  if (!text) return false;
  const spamPatterns = [/(.)\1{4,}/, /[A-Z]{10,}/, /https?:\/\//i];
  return spamPatterns.some((p) => p.test(text));
};

// POST /api/reviews
const createReview = async (req, res) => {
  const { restaurantId, foodId, orderId, rating, comment, images } = req.body;

  const existing = await Review.findOne({ orderId, userId: req.user.id });
  if (existing) return res.status(409).json({ success: false, error: { message: 'Review already submitted for this order', code: 'REVIEW_EXISTS' } });

  const { sentiment, score } = analyzeSentiment(comment);
  const spam = isSpam(comment);

  const review = await Review.create({
    userId: req.user.id, restaurantId, foodId, orderId, rating, comment, images,
    sentiment, sentimentScore: score, isSpam: spam,
  });

  res.status(201).json({ success: true, data: { review } });
};

// GET /api/reviews/restaurant/:restaurantId
const getRestaurantReviews = async (req, res) => {
  const { page = 1, limit = 20, sort = 'recent', rating } = req.query;
  const filter = { restaurantId: req.params.restaurantId, isSpam: false };
  if (rating) filter.rating = parseInt(rating);

  const sortMap = { recent: { createdAt: -1 }, helpful: { helpfulCount: -1 }, rating_high: { rating: -1 }, rating_low: { rating: 1 } };

  const [reviews, total] = await Promise.all([
    Review.find(filter).sort(sortMap[sort] || { createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
    Review.countDocuments(filter),
  ]);

  // Aggregate stats
  const stats = await Review.aggregate([
    { $match: { restaurantId: req.params.restaurantId, isSpam: false } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, total: { $sum: 1 }, positive: { $sum: { $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0] } } } },
  ]);

  res.json({ success: true, data: { reviews, stats: stats[0] || {}, meta: { total, page: +page, totalPages: Math.ceil(total / limit) } } });
};

// POST /api/reviews/:id/helpful
const markHelpful = async (req, res) => {
  const review = await Review.findByIdAndUpdate(req.params.id, { $inc: { helpfulCount: 1 } }, { new: true });
  if (!review) return res.status(404).json({ success: false, error: { message: 'Review not found' } });
  res.json({ success: true, data: { helpfulCount: review.helpfulCount } });
};

// POST /api/reviews/:id/reply (restaurant owner)
const replyToReview = async (req, res) => {
  const { text } = req.body;
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { reply: { text, repliedAt: new Date() } },
    { new: true }
  );
  if (!review) return res.status(404).json({ success: false, error: { message: 'Review not found' } });
  res.json({ success: true, data: { review } });
};

// GET /api/reviews/my
const getMyReviews = async (req, res) => {
  const reviews = await Review.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, data: { reviews } });
};

module.exports = { createReview, getRestaurantReviews, markHelpful, replyToReview, getMyReviews };
