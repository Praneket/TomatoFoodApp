const jwt = require('jsonwebtoken');

const authMiddleware = (allowedRoles = []) => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ success: false, error: { message: 'Forbidden' } });
    }
    next();
  } catch {
    res.status(401).json({ success: false, error: { message: 'Invalid token' } });
  }
};

module.exports = { authMiddleware };
