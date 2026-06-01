require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cartRoutes = require('./routes/cartRoutes');

const app = express();
const PORT = process.env.PORT || process.env.CART_SERVICE_PORT || 3005;

app.use(helmet());
app.use(cors({ origin: process.env.GATEWAY_URL || 'http://localhost:3000' }));
app.use(express.json());

app.use('/api/cart', cartRoutes);
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'cart-service' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ success: false, error: { message: err.message || 'Internal server error' } });
});

app.listen(PORT, () => console.log(`Cart Service running on port ${PORT}`));
module.exports = app;
