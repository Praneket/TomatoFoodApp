const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

const createOtp = async (userId, type) => {
  // Invalidate existing OTPs of same type
  await prisma.otpCode.updateMany({
    where: { userId, type, used: false },
    data: { used: true },
  });

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.otpCode.create({ data: { userId, code, type, expiresAt } });
  return code;
};

const verifyOtp = async (userId, code, type) => {
  const otp = await prisma.otpCode.findFirst({
    where: { userId, code, type, used: false, expiresAt: { gt: new Date() } },
  });

  if (!otp) return false;

  await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });
  return true;
};

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const sendVerificationEmail = async (email, name, otp) => {
  await transporter.sendMail({
    from: `"Tomato 🍅" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Verify your Tomato account',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#ff6b35,#f7c59f);padding:40px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:32px">🍅 Tomato</h1>
          <p style="color:#fff;margin:8px 0 0">Food Delivery Platform</p>
        </div>
        <div style="padding:40px">
          <h2 style="color:#333">Hi ${name}! 👋</h2>
          <p style="color:#666">Your verification code is:</p>
          <div style="background:#f8f9fa;border-radius:8px;padding:20px;text-align:center;margin:20px 0">
            <span style="font-size:36px;font-weight:bold;color:#ff6b35;letter-spacing:8px">${otp}</span>
          </div>
          <p style="color:#999;font-size:14px">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (email, name, otp) => {
  await transporter.sendMail({
    from: `"Tomato 🍅" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Reset your Tomato password',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#ff6b35,#f7c59f);padding:40px;text-align:center;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0">🍅 Tomato</h1>
        </div>
        <div style="padding:40px;background:#fff;border-radius:0 0 12px 12px">
          <h2>Password Reset Request</h2>
          <p>Hi ${name}, use this OTP to reset your password:</p>
          <div style="background:#fff3f0;border-radius:8px;padding:20px;text-align:center;margin:20px 0;border:2px solid #ff6b35">
            <span style="font-size:36px;font-weight:bold;color:#ff6b35;letter-spacing:8px">${otp}</span>
          </div>
          <p style="color:#999;font-size:14px">Expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
      </div>
    `,
  });
};

module.exports = { createOtp, verifyOtp, sendVerificationEmail, sendPasswordResetEmail };
