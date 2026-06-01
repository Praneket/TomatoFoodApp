require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const orderRoutes = require('./routes/orderRoutes');
const { errorHandler } = require('./middleware/errorHandler');
const { setIO } = require('./services/socketService');
const { startConsumer } = require('./services/messageConsumer');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || process.env.ORDER_SERVICE_PORT || 3006;

// Socket.IO setup
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
});
setIO(io);

// Socket auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication required'));
  try {
    socket.user = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const { id, role } = socket.user;
  socket.join(`user_${id}`);
  console.log(`Socket connected: user_${id} (${role})`);

  socket.on('join:order', (orderId) => socket.join(`order_${orderId}`));
  socket.on('join:restaurant', (restaurantId) => {
    if (['restaurant_owner', 'admin'].includes(role)) socket.join(`restaurant_${restaurantId}`);
  });
  socket.on('driver:location', (data) => {
    io.to(`order_${data.orderId}`).emit('driver:location_update', data);
  });
  socket.on('disconnect', () => console.log(`Socket disconnected: user_${id}`));
});

// Express middleware
app.use(helmet());
app.use(cors({ origin: process.env.GATEWAY_URL || 'http://localhost:3000' }));
app.use(express.json());

// Routes
app.use('/api/orders', orderRoutes);
app.get('/health', (req, res) => res.json({ status: 'healthy', service: 'order-service' }));
app.use(errorHandler);

// Start server immediately, connect DB + consumer in background
server.listen(PORT, () => console.log(`Order Service running on port ${PORT}`));
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tomato_orders')
  .then(() => { console.log('MongoDB connected (order-service)'); startConsumer(); })
  .catch((err) => console.error('MongoDB connection failed:', err.message));

module.exports = { app, server };
