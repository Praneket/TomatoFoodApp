const express = require('express');
const { body } = require('express-validator');
const passport = require('passport');
const { asyncHandler } = require('../middleware/asyncHandler');
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  register, login, refreshToken, logout,
  verifyEmail, forgotPassword, resetPassword,
  getMe, googleCallback,
} = require('../controllers/authController');

const router = express.Router();

const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('role').optional().isIn(['customer', 'restaurant_owner', 'delivery_partner']).withMessage('Invalid role'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

router.post('/register',        registerValidation, asyncHandler(register));
router.post('/login',           loginValidation,    asyncHandler(login));
router.post('/refresh',                             asyncHandler(refreshToken));
router.post('/logout',                              asyncHandler(logout));
router.post('/verify-email',                        asyncHandler(verifyEmail));
router.post('/forgot-password', [body('email').isEmail()], asyncHandler(forgotPassword));
router.post('/reset-password',  [body('newPassword').isLength({ min: 8 })], asyncHandler(resetPassword));
router.get('/me',               authMiddleware,     asyncHandler(getMe));

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/google/failure' }),
  asyncHandler(googleCallback)
);
router.get('/google/failure', (req, res) => res.status(401).json({ success: false, error: { message: 'Google auth failed' } }));

module.exports = router;
