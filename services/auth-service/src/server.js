require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const passport = require('passport');
const authRoutes = require('./routes/authRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const { createLogger } = require('./middleware/logger');
require('./config/passport');

const app = express();
const logger = createLogger('auth-service');
const PORT = process.env.PORT || process.env.AUTH_SERVICE_PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.GATEWAY_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'auth-service' }));
app.use(errorHandler);

app.listen(PORT, () => logger.info(`Auth Service running on port ${PORT}`));
module.exports = app;
