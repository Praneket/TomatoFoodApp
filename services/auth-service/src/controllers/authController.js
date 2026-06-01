const bcrypt = require('bcryptjs');
const { getPrisma } = require('../services/prismaClient');
const { validationResult } = require('express-validator');
const { generateAccessToken, generateRefreshToken, saveRefreshToken, rotateRefreshToken, revokeRefreshToken } = require('../services/tokenService');
const { createOtp, verifyOtp, sendVerificationEmail, sendPasswordResetEmail } = require('../services/otpService');
const { publishEvent } = require('../services/messageService');

const prisma = getPrisma();

// POST /api/auth/register
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: { message: 'Validation failed', details: errors.array() } });

  const { name, email, password, phone, role = 'CUSTOMER', referralCode } = req.body;

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, ...(phone ? [{ phone }] : [])] } });
  if (existing) return res.status(409).json({ success: false, error: { message: 'Email or phone already registered', code: 'USER_EXISTS' } });

  const passwordHash = await bcrypt.hash(password, 12);

  // Handle referral
  let referredBy = null;
  if (referralCode) {
    const referrer = await prisma.user.findUnique({ where: { referralCode } });
    if (referrer) referredBy = referrer.id;
  }

  const newReferralCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, role: role.toUpperCase(), referralCode: newReferralCode, referredBy },
    select: { id: true, name: true, email: true, role: true },
  });

  // Send verification OTP (non-blocking — don't fail registration if email/MQ is down)
  createOtp(user.id, 'EMAIL_VERIFICATION')
    .then((otp) => sendVerificationEmail(email, name, otp))
    .catch((err) => console.warn('Email send skipped:', err.message));

  publishEvent('user.registered', { userId: user.id, email, name, role })
    .catch((err) => console.warn('Event publish skipped:', err.message));

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your email.',
    data: { user },
  });
};

// POST /api/auth/login
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, error: { message: 'Validation failed', details: errors.array() } });

  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return res.status(401).json({ success: false, error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' } });

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return res.status(401).json({ success: false, error: { message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' } });

  if (!user.isActive) return res.status(403).json({ success: false, error: { message: 'Account suspended', code: 'ACCOUNT_SUSPENDED' } });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  await saveRefreshToken(user.id, refreshToken, req.headers['user-agent'], req.ip);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role.toLowerCase(), avatar: user.avatar, isVerified: user.isVerified },
    },
  });
};

// POST /api/auth/refresh
const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;
  if (!token) return res.status(400).json({ success: false, error: { message: 'Refresh token required', code: 'TOKEN_REQUIRED' } });

  const result = await rotateRefreshToken(token, req.headers['user-agent'], req.ip);
  if (!result) return res.status(401).json({ success: false, error: { message: 'Invalid or expired refresh token', code: 'INVALID_TOKEN' } });

  const accessToken = generateAccessToken(result.user);

  res.json({ success: true, data: { accessToken, refreshToken: result.refreshToken } });
};

// POST /api/auth/logout
const logout = async (req, res) => {
  const { refreshToken: token } = req.body;
  if (token) await revokeRefreshToken(token);
  res.json({ success: true, message: 'Logged out successfully' });
};

// POST /api/auth/verify-email
const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ success: false, error: { message: 'User not found', code: 'USER_NOT_FOUND' } });

  const isValid = await verifyOtp(user.id, otp, 'EMAIL_VERIFICATION');
  if (!isValid) return res.status(400).json({ success: false, error: { message: 'Invalid or expired OTP', code: 'INVALID_OTP' } });

  await prisma.user.update({ where: { id: user.id }, data: { isVerified: true } });
  await publishEvent('user.verified', { userId: user.id, email });

  res.json({ success: true, message: 'Email verified successfully' });
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (user) {
    createOtp(user.id, 'PASSWORD_RESET')
      .then((otp) => sendPasswordResetEmail(email, user.name, otp))
      .catch((err) => console.warn('Password reset email skipped:', err.message));
  }

  res.json({ success: true, message: 'If this email exists, a reset OTP has been sent.' });
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ success: false, error: { message: 'User not found', code: 'USER_NOT_FOUND' } });

  const isValid = await verifyOtp(user.id, otp, 'PASSWORD_RESET');
  if (!isValid) return res.status(400).json({ success: false, error: { message: 'Invalid or expired OTP', code: 'INVALID_OTP' } });

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  res.json({ success: true, message: 'Password reset successfully' });
};

// GET /api/auth/me
const getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, phone: true, role: true, avatar: true, isVerified: true, loyaltyPoints: true, referralCode: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ success: false, error: { message: 'User not found', code: 'USER_NOT_FOUND' } });
  res.json({ success: true, data: { user } });
};

// Google OAuth callback
const googleCallback = async (req, res) => {
  const user = req.user;
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken();
  await saveRefreshToken(user.id, refreshToken, req.headers['user-agent'], req.ip);

  const redirectUrl = `${process.env.CUSTOMER_APP_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
  res.redirect(redirectUrl);
};

module.exports = { register, login, refreshToken, logout, verifyEmail, forgotPassword, resetPassword, getMe, googleCallback };
