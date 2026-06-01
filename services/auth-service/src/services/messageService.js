const amqplib = require('amqplib');

let channel = null;

const connect = async () => {
  try {
    const conn = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await conn.createChannel();
    await channel.assertExchange('tomato_events', 'topic', { durable: true });
    console.log('RabbitMQ connected');
  } catch (err) {
    console.error('RabbitMQ connection failed, retrying in 5s...', err.message);
    setTimeout(connect, 5000);
  }
};

const publishEvent = async (routingKey, payload) => {
  if (!channel) return;
  channel.publish('tomato_events', routingKey, Buffer.from(JSON.stringify({ ...payload, timestamp: new Date().toISOString() })), { persistent: true });
};

connect();
module.exports = { publishEvent };
