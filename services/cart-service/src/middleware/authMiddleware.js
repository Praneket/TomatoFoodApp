const jwt = require('jsonwebtoken');
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
  try { req.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET); next(); }
  catch { res.status(401).json({ success: false, error: { message: 'Invalid token' } }); }
};
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
module.exports = { authMiddleware, asyncHandler };
