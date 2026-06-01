const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const { createReview, getRestaurantReviews, markHelpful, replyToReview, getMyReviews } = require('./controllers/reviewController');

const app = express();
const PORT = process.env.PORT || process.env.REVIEW_SERVICE_PORT || 3010;

app.use(helmet());
app.use(cors());
app.use(express.json());

const auth = (roles = []) => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    if (roles.length && !roles.includes(decoded.role)) return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
    next();
  } catch { res.status(401).json({ success: false, error: { message: 'Invalid token' } }); }
};
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.post('/api/reviews',                          auth(['customer']),                    wrap(createReview));
app.get('/api/reviews/my',                        auth(),                                wrap(getMyReviews));
app.get('/api/reviews/restaurant/:restaurantId',                                         wrap(getRestaurantReviews));
app.post('/api/reviews/:id/helpful',              auth(),                                wrap(markHelpful));
app.post('/api/reviews/:id/reply',                auth(['restaurant_owner', 'admin']),   wrap(replyToReview));

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'review-service' }));
app.use((err, req, res, next) => res.status(500).json({ success: false, error: { message: err.message } }));

app.listen(PORT, () => console.log(`Review Service running on port ${PORT}`));
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tomato_reviews')
  .then(() => console.log('MongoDB connected (review-service)'))
  .catch((err) => console.error('MongoDB connection failed:', err.message));

module.exports = app;
