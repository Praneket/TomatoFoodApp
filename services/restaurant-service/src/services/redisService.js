const { createClient } = require('redis');
let client = null;

const connectRedis = async () => {
  try {
    client = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    client.on('error', (err) => console.error('Redis error:', err.message));
    await client.connect();
    console.log('Redis connected (restaurant-service)');
  } catch (err) {
    console.error('Redis connection failed:', err.message);
    client = null;
  }
};

const getRedis = () => client;
connectRedis();
module.exports = { getRedis };
