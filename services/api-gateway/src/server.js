require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const { v4: uuidv4 } = require('uuid');

const authMiddleware = require('./middleware/auth');
const { createLogger } = require('./middleware/logger');
const { errorHandler } = require('./middleware/errorHandler');
const swaggerDoc = require('./swagger');

const app = express();
const logger = createLogger('api-gateway');
const PORT = process.env.PORT || process.env.GATEWAY_PORT || 3000;

// ============================================================
// SERVICE REGISTRY
// ============================================================
const SERVICES = {
  auth:         process.env.AUTH_SERVICE_URL         || 'http://localhost:3001',
  user:         process.env.USER_SERVICE_URL         || 'http://localhost:3002',
  restaurant:   process.env.RESTAURANT_SERVICE_URL   || 'http://localhost:3003',
  catalog:      process.env.CATALOG_SERVICE_URL      || 'http://localhost:3004',
  cart:         process.env.CART_SERVICE_URL         || 'http://localhost:3005',
  order:        process.env.ORDER_SERVICE_URL        || 'http://localhost:3006',
  payment:      process.env.PAYMENT_SERVICE_URL      || 'http://localhost:3007',
  delivery:     process.env.DELIVERY_SERVICE_URL     || 'http://localhost:3008',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3009',
  review:       process.env.REVIEW_SERVICE_URL       || 'http://localhost:3010',
  analytics:    process.env.ANALYTICS_SERVICE_URL    || 'http://localhost:3011',
  ai:           process.env.AI_SERVICE_URL           || 'http://localhost:8000',
};

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
}));

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

app.options('*', cors({ origin: true, credentials: true }));

app.use(compression());
// Parse body only for auth middleware to read — proxy re-streams it
app.use((req, res, next) => {
  if (req.path.startsWith('/api/payments/webhook')) return next();
  express.json({ limit: '10mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// REQUEST ID & LOGGING
// ============================================================
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

app.use(morgan('combined', {
  stream: { write: (msg) => logger.info(msg.trim()) },
}));

// ============================================================
// RATE LIMITING
// ============================================================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' } },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: { message: 'Too many auth attempts', code: 'AUTH_RATE_LIMIT' } },
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: { message: 'Too many payment requests', code: 'PAYMENT_RATE_LIMIT' } },
});

app.use(globalLimiter);

// ============================================================
// PROXY FACTORY
// http-proxy-middleware v3 removed pathRewrite.
// We restore the full original URL in the proxyReq handler.
// ============================================================
const createProxy = (target) =>
  createProxyMiddleware({
    target,
    changeOrigin: true,
    proxyTimeout: 60000,
    timeout: 60000,
    on: {
      error: (err, req, res) => {
        logger.error(`Proxy error to ${target}: ${err.message}`);
        if (res.headersSent) return;
        res.status(503).json({ success: false, error: { message: 'Service temporarily unavailable — please retry', code: 'SERVICE_UNAVAILABLE' } });
      },
      proxyReq: (proxyReq, req) => {
        // Restore full path — HPM v3 strips the mount prefix, downstream services need the full path
        const fullPath = req.originalUrl;
        proxyReq.path = fullPath;

        proxyReq.setHeader('X-Request-ID', req.id || '');
        proxyReq.setHeader('X-Forwarded-For', req.ip || '');
        proxyReq.removeHeader('origin');
        if (req.user) {
          proxyReq.setHeader('X-User-ID', req.user.id);
          proxyReq.setHeader('X-User-Role', req.user.role);
        }
        if (req.body && Object.keys(req.body).length > 0) {
          const bodyStr = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyStr));
          proxyReq.write(bodyStr);
        }
      },
      proxyRes: (proxyRes) => {
        delete proxyRes.headers['access-control-allow-origin'];
        delete proxyRes.headers['access-control-allow-credentials'];
        delete proxyRes.headers['access-control-allow-methods'];
        delete proxyRes.headers['access-control-allow-headers'];
        delete proxyRes.headers['access-control-expose-headers'];
      },
    },
  });

// ============================================================
// PUBLIC ROUTES (no auth required)
// ============================================================
app.use('/api/auth',               authLimiter,                                              createProxy(SERVICES.auth));
app.use('/api/catalog',                                                                       createProxy(SERVICES.catalog));
app.use('/api/restaurants/public',                                                            createProxy(SERVICES.restaurant));

// Stripe webhook (raw body needed)
app.use('/api/payments/webhook',   express.raw({ type: 'application/json' }),                createProxy(SERVICES.payment));

// ============================================================
// PROTECTED ROUTES (auth required)
// ============================================================
app.use('/api/users',         authMiddleware(),                                               createProxy(SERVICES.user));
app.use('/api/restaurants',   authMiddleware(),                                               createProxy(SERVICES.restaurant));
app.use('/api/cart',          authMiddleware(['customer']),                                   createProxy(SERVICES.cart));
app.use('/api/orders',        authMiddleware(['customer', 'restaurant_owner', 'delivery_partner', 'admin']), createProxy(SERVICES.order));
app.use('/api/payments',      authMiddleware(), paymentLimiter,                              createProxy(SERVICES.payment));
app.use('/api/delivery',      authMiddleware(),                                               createProxy(SERVICES.delivery));
app.use('/api/notifications', authMiddleware(),                                               createProxy(SERVICES.notification));
app.use('/api/reviews',       authMiddleware(),                                               createProxy(SERVICES.review));
app.use('/api/analytics',     authMiddleware(['admin', 'super_admin', 'restaurant_owner']),  createProxy(SERVICES.analytics));
app.use('/api/ai',            authMiddleware(),                                               createProxy(SERVICES.ai));

// ============================================================
// SWAGGER DOCS
// ============================================================
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
  customCss: '.swagger-ui .topbar { background: #ff6b35; }',
  customSiteTitle: 'Tomato API Docs',
}));

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', async (req, res) => {
  const checks = await Promise.allSettled(
    Object.entries(SERVICES).map(async ([name, url]) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      try {
        const resp = await fetch(`${url}/health`, { signal: controller.signal });
        clearTimeout(timeout);
        return { name, status: resp.ok ? 'healthy' : 'unhealthy', url };
      } catch {
        clearTimeout(timeout);
        return { name, status: 'unreachable', url };
      }
    })
  );

  const services = checks.map((r) => (r.status === 'fulfilled' ? r.value : { name: 'unknown', status: 'error' }));
  const allHealthy = services.every((s) => s.status === 'healthy');

  res.status(allHealthy ? 200 : 207).json({
    status: allHealthy ? 'healthy' : 'degraded',
    gateway: 'online',
    services,
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => res.json({ name: 'Tomato API Gateway', version: '1.0.0', status: 'running' }));

// ============================================================
// ERROR HANDLER
// ============================================================
app.use(errorHandler);

app.listen(PORT, () => logger.info(`🚀 API Gateway running on port ${PORT}`));

module.exports = app;
