require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const paymentRoutes = require('./routes/paymentRoutes');

const app = express();
const PORT = process.env.PORT || process.env.PAYMENT_SERVICE_PORT || 3007;

app.use(helmet());
app.use(cors({ origin: process.env.GATEWAY_URL || 'http://localhost:3000' }));

// Stripe webhook needs raw body BEFORE json middleware
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use('/api/payments', paymentRoutes);
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'payment-service' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ success: false, error: { message: err.message || 'Internal server error' } });
});

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tomato_payments')
  .then(() => app.listen(PORT, () => console.log(`Payment Service running on port ${PORT}`)))
  .catch((err) => { console.error(err); process.exit(1); });

module.exports = app;
