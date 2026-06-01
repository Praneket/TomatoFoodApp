const mongoose = require('mongoose');

// Connect to orders DB for aggregation
const orderConn = mongoose.createConnection(process.env.ORDERS_MONGO_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/tomato_orders');

const OrderModel = orderConn.model('Order', new mongoose.Schema({
  orderId: String, userId: String, restaurantId: String,
  totalAmount: Number, status: String, paymentMethod: String,
  items: Array, createdAt: Date,
}, { collection: 'orders' }));

// GET /api/analytics/platform (super admin)
const getPlatformAnalytics = async (req, res) => {
  const { from, to } = req.query;
  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) dateFilter.$lte = new Date(to);
  const match = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

  const [revenue, orderStats, topRestaurants, dailyRevenue] = await Promise.all([
    OrderModel.aggregate([
      { $match: { ...match, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 }, avg: { $avg: '$totalAmount' } } },
    ]),
    OrderModel.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    OrderModel.aggregate([
      { $match: { ...match, status: 'delivered' } },
      { $group: { _id: '$restaurantId', revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]),
    OrderModel.aggregate([
      { $match: { ...match, status: 'delivered' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $limit: 30 },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      revenue: revenue[0] || { total: 0, count: 0, avg: 0 },
      ordersByStatus: orderStats,
      topRestaurants,
      dailyRevenue,
    },
  });
};

// GET /api/analytics/restaurant/:restaurantId
const getRestaurantAnalytics = async (req, res) => {
  const { restaurantId } = req.params;
  const { period = '30d' } = req.query;

  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [revenue, topItems, hourlyOrders, statusBreakdown] = await Promise.all([
    OrderModel.aggregate([
      { $match: { restaurantId, status: 'delivered', createdAt: { $gte: fromDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    OrderModel.aggregate([
      { $match: { restaurantId, status: 'delivered', createdAt: { $gte: fromDate } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', count: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    OrderModel.aggregate([
      { $match: { restaurantId, createdAt: { $gte: fromDate } } },
      { $group: { _id: { $hour: '$createdAt' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    OrderModel.aggregate([
      { $match: { restaurantId, createdAt: { $gte: fromDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  res.json({ success: true, data: { revenue, topItems, hourlyOrders, statusBreakdown } });
};

// GET /api/analytics/customer/:userId
const getCustomerAnalytics = async (req, res) => {
  const { userId } = req.params;

  const [summary, favoriteRestaurants, monthlySpend] = await Promise.all([
    OrderModel.aggregate([
      { $match: { userId, status: 'delivered' } },
      { $group: { _id: null, totalOrders: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' }, avgOrder: { $avg: '$totalAmount' } } },
    ]),
    OrderModel.aggregate([
      { $match: { userId, status: 'delivered' } },
      { $group: { _id: '$restaurantId', orders: { $sum: 1 }, spent: { $sum: '$totalAmount' } } },
      { $sort: { orders: -1 } },
      { $limit: 5 },
    ]),
    OrderModel.aggregate([
      { $match: { userId, status: 'delivered' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, spent: { $sum: '$totalAmount' }, orders: { $sum: 1 } } },
      { $sort: { _id: -1 } },
      { $limit: 12 },
    ]),
  ]);

  res.json({ success: true, data: { summary: summary[0] || {}, favoriteRestaurants, monthlySpend } });
};

module.exports = { getPlatformAnalytics, getRestaurantAnalytics, getCustomerAnalytics };
