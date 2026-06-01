require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const restaurantRoutes = require('./routes/restaurantRoutes');

const app = express();
const PORT = process.env.PORT || process.env.RESTAURANT_SERVICE_PORT || 3003;

app.use(helmet());
app.use(cors({ origin: process.env.GATEWAY_URL || 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/restaurants', restaurantRoutes);
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'restaurant-service' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ success: false, error: { message: err.message || 'Internal server error' } });
});

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tomato_restaurants')
  .then(() => app.listen(PORT, () => console.log(`Restaurant Service running on port ${PORT}`)))
  .catch((err) => { console.error(err); process.exit(1); });

module.exports = app;
