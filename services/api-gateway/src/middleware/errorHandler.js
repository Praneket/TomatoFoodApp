const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || err.status || 500;
  const message = err.isOperational ? err.message : 'Internal server error';
  res.status(status).json({
    success: false,
    error: { message, code: err.code || 'INTERNAL_ERROR' },
    requestId: req.id,
  });
};

module.exports = { errorHandler };
