require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const amqplib = require('amqplib');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || process.env.NOTIFICATION_SERVICE_PORT || 3009;

app.use(helmet());
app.use(cors());
app.use(express.json());

// ============================================================
// EMAIL SERVICE
// ============================================================
const smtpReady = process.env.SMTP_USER && process.env.SMTP_PASS
  && !process.env.SMTP_USER.includes('your_email');

const transporter = smtpReady ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
}) : null;

if (!smtpReady) console.log('[Notification] SMTP not configured — emails will be mocked');

const sendEmail = async ({ to, subject, html }) => {
  if (!transporter) return console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
  await transporter.sendMail({ from: `"Tomato 🍅" <${process.env.SMTP_USER}>`, to, subject, html });
  console.log(`Email sent to ${to}`);
};

// ============================================================
// SMS SERVICE (Twilio)
// ============================================================
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
const twilioReady = TWILIO_SID && TWILIO_SID.startsWith('AC');
const twilioClient = twilioReady
  ? twilio(TWILIO_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

if (!twilioReady) console.log('[Notification] Twilio not configured — SMS will be mocked');

const sendSMS = async ({ to, body }) => {
  if (!twilioClient) return console.log(`[SMS MOCK] To: ${to} | ${body}`);
  await twilioClient.messages.create({ body, from: process.env.TWILIO_PHONE_NUMBER, to });
  console.log(`SMS sent to ${to}`);
};

// ============================================================
// EMAIL TEMPLATES
// ============================================================
const templates = {
  order_placed: (data) => ({
    subject: `Order Confirmed! #${data.orderId}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:linear-gradient(135deg,#ff6b35,#f7c59f);padding:30px;text-align:center;border-radius:12px 12px 0 0">
        <h1 style="color:#fff;margin:0">🍅 Tomato</h1>
      </div>
      <div style="padding:30px;background:#fff;border-radius:0 0 12px 12px;border:1px solid #eee">
        <h2 style="color:#333">Order Placed Successfully! 🎉</h2>
        <p>Your order <strong>#${data.orderId}</strong> has been placed.</p>
        <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0">
          <p style="margin:0"><strong>Total:</strong> ₹${data.totalAmount}</p>
          <p style="margin:5px 0"><strong>Estimated Delivery:</strong> 30-45 minutes</p>
        </div>
        <p style="color:#999;font-size:12px">Track your order in the Tomato app.</p>
      </div>
    </div>`,
  }),

  order_delivered: (data) => ({
    subject: `Order Delivered! Rate your experience 🌟`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px">
      <h2>Your order #${data.orderId} has been delivered! 🎉</h2>
      <p>We hope you enjoyed your meal. Please rate your experience.</p>
    </div>`,
  }),

  order_cancelled: (data) => ({
    subject: `Order Cancelled - #${data.orderId}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:30px">
      <h2>Order Cancelled</h2>
      <p>Your order #${data.orderId} has been cancelled. Refund will be processed in 3-5 business days.</p>
    </div>`,
  }),
};

// ============================================================
// RABBITMQ CONSUMER
// ============================================================
const startConsumer = async () => {
  try {
    const conn = await amqplib.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const ch = await conn.createChannel();
    await ch.assertExchange('tomato_events', 'topic', { durable: true });

    const q = await ch.assertQueue('notification_service_queue', { durable: true });
    const bindings = [
      'user.registered', 'user.verified',
      'order.placed', 'order.confirmed', 'order.delivered', 'order.cancelled',
      'payment.success', 'payment.failed',
      'delivery.assigned',
      'notification.email', 'notification.sms', 'notification.push',
    ];
    await Promise.all(bindings.map((key) => ch.bindQueue(q.queue, 'tomato_events', key)));

    ch.consume(q.queue, async (msg) => {
      if (!msg) return;
      const event = JSON.parse(msg.content.toString());
      const key = msg.fields.routingKey;

      try {
        // Direct notification requests
        if (key === 'notification.email') {
          await sendEmail(event);
        } else if (key === 'notification.sms') {
          await sendSMS(event);
        }

        // Order events
        else if (key === 'order.placed' && event.userEmail) {
          const tmpl = templates.order_placed(event);
          await sendEmail({ to: event.userEmail, ...tmpl });
          if (event.userPhone) await sendSMS({ to: event.userPhone, body: `Tomato: Your order #${event.orderId} is confirmed! Estimated delivery: 30-45 mins.` });
        }

        else if (key === 'order.delivered' && event.userEmail) {
          const tmpl = templates.order_delivered(event);
          await sendEmail({ to: event.userEmail, ...tmpl });
        }

        else if (key === 'order.cancelled' && event.userEmail) {
          const tmpl = templates.order_cancelled(event);
          await sendEmail({ to: event.userEmail, ...tmpl });
        }

        // User registration
        else if (key === 'user.registered' && event.email) {
          await sendEmail({
            to: event.email,
            subject: 'Welcome to Tomato! 🍅',
            html: `<div style="font-family:Arial,sans-serif;padding:30px"><h2>Welcome, ${event.name}!</h2><p>Your account has been created. Verify your email to start ordering.</p></div>`,
          });
        }

        ch.ack(msg);
      } catch (err) {
        console.error(`Notification error for ${key}:`, err.message);
        ch.nack(msg, false, false); // discard, don't requeue to avoid infinite loop
      }
    });

    console.log('Notification service consumer started');
  } catch (err) {
    console.error('Notification consumer failed, retrying...', err.message);
    setTimeout(startConsumer, 5000);
  }
};

app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'notification-service' }));

startConsumer();
app.listen(PORT, () => console.log(`Notification Service running on port ${PORT}`));
module.exports = app;
