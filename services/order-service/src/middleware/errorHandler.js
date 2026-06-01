const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ success: false, error: { message: err.isOperational ? err.message : 'Internal server error', code: err.code || 'INTERNAL_ERROR' } });
};
module.exports = { errorHandler };
