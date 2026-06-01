const winston = require('winston');
const { createError } = require('@tomato/shared-types');

// ============================================================
// LOGGER - Winston structured logging
// ============================================================
const createLogger = (serviceName) =>
  winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, service, ...meta }) =>
            `${timestamp} [${service}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`
          )
        ),
      }),
      new winston.transports.File({ filename: `logs/${serviceName}-error.log`, level: 'error' }),
      new winston.transports.File({ filename: `logs/${serviceName}-combined.log` }),
    ],
  });

// ============================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================
const errorHandler = (err, req, res, next) => {
  const logger = createLogger('error-handler');
  logger.error(err.message, { stack: err.stack, path: req.path, method: req.method });

  const statusCode = err.statusCode || err.status || 500;
  const message = err.isOperational ? err.message : 'Internal server error';
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json(createError(message, code, err.details || null));
};

// ============================================================
// CUSTOM APP ERROR
// ============================================================
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ============================================================
// ASYNC HANDLER - wraps async route handlers
// ============================================================
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ============================================================
// PAGINATION HELPER
// ============================================================
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const paginateMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNext: page * limit < total,
  hasPrev: page > 1,
});

// ============================================================
// VALIDATORS
// ============================================================
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^\+?[1-9]\d{9,14}$/.test(phone);
const isValidObjectId = (id) => /^[a-f\d]{24}$/i.test(id);

module.exports = {
  createLogger,
  errorHandler,
  AppError,
  asyncHandler,
  getPagination,
  paginateMeta,
  isValidEmail,
  isValidPhone,
  isValidObjectId,
};
