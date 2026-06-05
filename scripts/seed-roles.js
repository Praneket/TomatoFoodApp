/**
 * TOMATO - Prisma Role Seeder
 * Promotes admin@tomato.com to ADMIN role in PostgreSQL (Neon)
 * Run: node scripts/seed-roles.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function seedRoles() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });

  console.log('\n🌱 Setting user roles in PostgreSQL...\n');

  try {
    const admin = await prisma.user.update({
      where: { email: 'admin@tomato.com' },
      data: { role: 'ADMIN', isVerified: true },
    });
    console.log(`✅ admin@tomato.com → ADMIN`);

    await prisma.user.update({
      where: { email: 'customer@tomato.com' },
      data: { isVerified: true },
    });
    console.log(`✅ customer@tomato.com → verified`);

    await prisma.user.update({
      where: { email: 'owner@tomato.com' },
      data: { isVerified: true },
    });
    console.log(`✅ owner@tomato.com → verified`);

    await prisma.user.update({
      where: { email: 'delivery@tomato.com' },
      data: { isVerified: true },
    });
    console.log(`✅ delivery@tomato.com → verified`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n💡 Make sure you ran seed-users.js first to create the accounts.');
  } finally {
    await prisma.$disconnect();
  }
}

seedRoles();
