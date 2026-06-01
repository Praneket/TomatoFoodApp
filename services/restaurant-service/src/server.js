require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || process.env.RESTAURANT_SERVICE_PORT || 3003;

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check always available — even if routes fail to load
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'restaurant-service' }));

// Load routes safely — if uploadService crashes due to missing package, service still starts
try {
  const restaurantRoutes = require('./routes/restaurantRoutes');
  app.use('/api/restaurants', restaurantRoutes);
  console.log('Restaurant routes loaded');
} catch (err) {
  console.error('Failed to load restaurant routes:', err.message);
  // Fallback: return 503 on all /api/restaurants requests instead of 404
  app.use('/api/restaurants', (req, res) => {
    res.status(503).json({ success: false, error: { message: 'Restaurant service initializing, please retry' } });
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ success: false, error: { message: err.message || 'Internal server error' } });
});

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tomato_restaurants')
  .then(() => app.listen(PORT, () => console.log(`Restaurant Service running on port ${PORT}`)))
  .catch((err) => { console.error(err); process.exit(1); });

module.exports = app;
