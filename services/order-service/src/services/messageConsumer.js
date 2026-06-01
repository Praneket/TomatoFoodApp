const amqplib = require('amqplib');
const Order = require('../models/Order');
const { getIO } = require('./socketService');

const startConsumer = async () => {
  try {
    const conn = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const ch = await conn.createChannel();
    await ch.assertExchange('tomato_events', 'topic', { durable: true });

    const q = await ch.assertQueue('order_service_queue', { durable: true });
    const bindings = ['payment.success', 'payment.failed', 'delivery.accepted', 'delivery.picked_up', 'delivery.completed'];
    await Promise.all(bindings.map((key) => ch.bindQueue(q.queue, 'tomato_events', key)));

    ch.consume(q.queue, async (msg) => {
      if (!msg) return;
      const event = JSON.parse(msg.content.toString());
      const key = msg.fields.routingKey;

      try {
        if (key === 'payment.success') {
          await Order.findOneAndUpdate(
            { orderId: event.orderId },
            { paymentStatus: 'completed', paymentId: event.paymentId, status: 'confirmed', $push: { statusHistory: { status: 'confirmed', note: 'Payment confirmed' } } }
          );
          getIO()?.to(`order_${event.orderId}`).emit('order:status_update', { orderId: event.orderId, status: 'confirmed' });
        }

        if (key === 'payment.failed') {
          await Order.findOneAndUpdate(
            { orderId: event.orderId },
            { paymentStatus: 'failed', status: 'cancelled', $push: { statusHistory: { status: 'cancelled', note: 'Payment failed' } } }
          );
        }

        if (key === 'delivery.accepted') {
          await Order.findOneAndUpdate(
            { orderId: event.orderId },
            { deliveryPartnerId: event.partnerId, $push: { statusHistory: { status: 'preparing', note: 'Delivery partner assigned' } } }
          );
        }

        if (key === 'delivery.picked_up') {
          await Order.findOneAndUpdate(
            { orderId: event.orderId },
            { status: 'out_for_delivery', $push: { statusHistory: { status: 'out_for_delivery', note: 'Order picked up by delivery partner' } } }
          );
          getIO()?.to(`order_${event.orderId}`).emit('order:status_update', { orderId: event.orderId, status: 'out_for_delivery' });
        }

        if (key === 'delivery.completed') {
          await Order.findOneAndUpdate(
            { orderId: event.orderId },
            { status: 'delivered', deliveredAt: new Date(), paymentStatus: 'completed', $push: { statusHistory: { status: 'delivered', note: 'Order delivered successfully' } } }
          );
          getIO()?.to(`order_${event.orderId}`).emit('order:delivered', { orderId: event.orderId });
        }

        ch.ack(msg);
      } catch (err) {
        console.error('Consumer error:', err.message);
        ch.nack(msg, false, true);
      }
    });

    console.log('Order service consumer started');
  } catch (err) {
    console.error('Consumer start failed, retrying...', err.message);
    setTimeout(startConsumer, 5000);
  }
};

module.exports = { startConsumer };
