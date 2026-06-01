require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { getPlatformAnalytics, getRestaurantAnalytics, getCustomerAnalytics } = require('./controllers/analyticsController');

const app = express();
const PORT = process.env.PORT || process.env.ANALYTICS_SERVICE_PORT || 3011;

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

app.get('/api/analytics/platform',                    auth(['admin', 'super_admin']),                    wrap(getPlatformAnalytics));
app.get('/api/analytics/restaurant/:restaurantId',    auth(['restaurant_owner', 'admin', 'super_admin']), wrap(getRestaurantAnalytics));
app.get('/api/analytics/customer/:userId',            auth(['admin', 'super_admin']),                    wrap(getCustomerAnalytics));

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'analytics-service' }));
app.use((err, req, res, next) => res.status(500).json({ success: false, error: { message: err.message } }));

app.listen(PORT, () => console.log(`Analytics Service running on port ${PORT}`));
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tomato_analytics')
  .then(() => console.log('MongoDB connected (analytics-service)'))
  .catch((err) => console.error('MongoDB connection failed:', err.message));

module.exports = app;
