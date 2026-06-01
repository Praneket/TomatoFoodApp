require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const app = express();
const { createLogger } = require('./middleware/logger');
const logger = createLogger('auth-service');
const PORT = process.env.PORT || process.env.AUTH_SERVICE_PORT || 3001;

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health always available
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'auth-service' }));

// Load routes safely
try {
  const passport = require('passport');
  require('./config/passport');
  const authRoutes = require('./routes/authRoutes');
  const { errorHandler } = require('./middleware/errorHandler');

  app.use(passport.initialize());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
  logger.info('Auth routes loaded');
} catch (err) {
  logger.error('Failed to load auth routes: ' + err.message);
  app.use('/api/auth', (req, res) => {
    res.status(503).json({ success: false, error: { message: 'Auth service initializing, please retry in a moment' } });
  });
}

app.listen(PORT, () => logger.info(`Auth Service running on port ${PORT}`));
module.exports = app;
