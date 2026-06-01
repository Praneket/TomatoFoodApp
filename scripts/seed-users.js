/**
 * TOMATO - User Seeder
 * Creates test accounts via the live auth API
 * Run: node scripts/seed-users.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const https = require('https');
const http = require('http');

const API = process.env.API_URL || 'https://tomato-api-gateway.onrender.com';

const USERS = [
  { name: 'Customer User',   email: 'customer@tomato.com',  password: 'Password123!', role: 'customer' },
  { name: 'Admin User',      email: 'admin@tomato.com',     password: 'Admin123!',    role: 'customer' }, // role set via DB after
  { name: 'Owner User',      email: 'owner@tomato.com',     password: 'Owner123!',    role: 'restaurant_owner' },
  { name: 'Delivery User',   email: 'delivery@tomato.com',  password: 'Delivery123!', role: 'delivery_partner' },
];

function post(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsed = new URL(url);
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request({
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    }, (res) => {
      let body = '';
      res.on('data', (c) => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function seedUsers() {
  console.log(`\n🌱 Seeding users via ${API}\n`);

  for (const user of USERS) {
    try {
      const res = await post(`${API}/api/auth/register`, user);
      if (res.status === 201) {
        console.log(`✅ Created: ${user.email} (${user.role})`);
      } else if (res.status === 409) {
        console.log(`⚠️  Already exists: ${user.email}`);
      } else {
        console.log(`❌ Failed ${user.email}: ${res.status} - ${JSON.stringify(res.data?.error || res.data)}`);
      }
    } catch (err) {
      console.log(`❌ Error ${user.email}: ${err.message}`);
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\n📋 Test Credentials:');
  console.log('   Customer : customer@tomato.com  / Password123!');
  console.log('   Admin    : admin@tomato.com     / Admin123!');
  console.log('   Owner    : owner@tomato.com     / Owner123!');
  console.log('   Delivery : delivery@tomato.com  / Delivery123!');
  console.log('\n⚠️  Note: To make admin@tomato.com an ADMIN role, run the Prisma seed below.');
}

seedUsers();
