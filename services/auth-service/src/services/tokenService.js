const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getPrisma } = require('./prismaClient');
const prisma = getPrisma();

const generateAccessToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role.toLowerCase() },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m', issuer: 'tomato-auth' }
  );

const generateRefreshToken = () => uuidv4() + '-' + Date.now();

const saveRefreshToken = async (userId, refreshToken, deviceInfo, ipAddress) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await prisma.session.create({ data: { userId, refreshToken, deviceInfo, ipAddress, expiresAt } });
};

const rotateRefreshToken = async (oldToken, deviceInfo, ipAddress) => {
  const session = await prisma.session.findUnique({ where: { refreshToken: oldToken }, include: { user: true } });
  if (!session || session.expiresAt < new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  const newRefreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.update({
    where: { id: session.id },
    data: { refreshToken: newRefreshToken, expiresAt, deviceInfo, ipAddress },
  });

  return { user: session.user, refreshToken: newRefreshToken };
};

const revokeRefreshToken = async (refreshToken) => {
  await prisma.session.deleteMany({ where: { refreshToken } });
};

const revokeAllUserTokens = async (userId) => {
  await prisma.session.deleteMany({ where: { userId } });
};

module.exports = { generateAccessToken, generateRefreshToken, saveRefreshToken, rotateRefreshToken, revokeRefreshToken, revokeAllUserTokens };
