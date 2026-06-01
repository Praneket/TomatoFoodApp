const amqplib = require('amqplib');
let channel = null;
const connect = async () => {
  try {
    const conn = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await conn.createChannel();
    await channel.assertExchange('tomato_events', 'topic', { durable: true });
    console.log('RabbitMQ connected (delivery-service)');
  } catch (err) { console.error('RabbitMQ failed:', err.message); setTimeout(connect, 5000); }
};
const publishEvent = async (key, payload) => {
  if (!channel) return;
  channel.publish('tomato_events', key, Buffer.from(JSON.stringify({ ...payload, timestamp: new Date().toISOString() })), { persistent: true });
};
connect();
module.exports = { publishEvent };
