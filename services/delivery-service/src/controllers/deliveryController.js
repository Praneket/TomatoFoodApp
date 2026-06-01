const { DeliveryPartner, Delivery } = require('../models/Delivery');
const { publishEvent } = require('../services/messageService');
const { getRedis } = require('../services/redisService');
const crypto = require('crypto');

// POST /api/delivery/partner/register
const registerPartner = async (req, res) => {
  const existing = await DeliveryPartner.findOne({ userId: req.user.id });
  if (existing) return res.status(409).json({ success: false, error: { message: 'Already registered as delivery partner' } });

  const partner = await DeliveryPartner.create({ userId: req.user.id, ...req.body });
  res.status(201).json({ success: true, data: { partner } });
};

// GET /api/delivery/partner/me
const getMyProfile = async (req, res) => {
  const partner = await DeliveryPartner.findOne({ userId: req.user.id });
  if (!partner) return res.status(404).json({ success: false, error: { message: 'Partner profile not found' } });
  res.json({ success: true, data: { partner } });
};

// PATCH /api/delivery/partner/location
const updateLocation = async (req, res) => {
  const { lat, lng } = req.body;
  const redis = getRedis();

  await DeliveryPartner.findOneAndUpdate(
    { userId: req.user.id },
    { currentLocation: { lat, lng, updatedAt: new Date() } }
  );

  // Cache location in Redis for fast lookup
  if (redis) await redis.setEx(`driver:location:${req.user.id}`, 300, JSON.stringify({ lat, lng, updatedAt: new Date() }));

  // Broadcast to active order room
  const activeDelivery = await Delivery.findOne({ partnerId: req.user.id, status: { $in: ['accepted', 'picked_up'] } });
  if (activeDelivery) {
    await publishEvent('delivery.location_update', { orderId: activeDelivery.orderId, partnerId: req.user.id, lat, lng });
  }

  res.json({ success: true, message: 'Location updated' });
};

// PATCH /api/delivery/partner/toggle-online
const toggleOnline = async (req, res) => {
  const partner = await DeliveryPartner.findOne({ userId: req.user.id });
  if (!partner) return res.status(404).json({ success: false, error: { message: 'Partner not found' } });

  partner.isOnline = !partner.isOnline;
  partner.isAvailable = partner.isOnline;
  await partner.save();

  res.json({ success: true, data: { isOnline: partner.isOnline } });
};

// POST /api/delivery/assign (called internally by order saga)
const assignDelivery = async (req, res) => {
  const { orderId, restaurantId, restaurantLocation, deliveryLocation } = req.body;

  // Find nearest available partner
  const partner = await DeliveryPartner.findOne({ isOnline: true, isAvailable: true, isVerified: true });

  if (!partner) {
    await Delivery.create({ orderId, restaurantId, restaurantLocation, deliveryLocation, status: 'unassigned' });
    return res.status(202).json({ success: true, message: 'No partners available, order queued' });
  }

  const otp = crypto.randomInt(1000, 9999).toString();
  const delivery = await Delivery.create({
    orderId, partnerId: partner.userId, restaurantId,
    restaurantLocation, deliveryLocation,
    status: 'assigned', assignedAt: new Date(),
    earnings: 40, otp,
  });

  await DeliveryPartner.findByIdAndUpdate(partner._id, { isAvailable: false });
  await publishEvent('delivery.assigned', { orderId, partnerId: partner.userId, partnerName: partner.name });

  res.json({ success: true, data: { delivery, partnerId: partner.userId } });
};

// GET /api/delivery/active (for delivery partner)
const getActiveDelivery = async (req, res) => {
  const delivery = await Delivery.findOne({ partnerId: req.user.id, status: { $in: ['assigned', 'accepted', 'picked_up'] } });
  res.json({ success: true, data: { delivery } });
};

// PATCH /api/delivery/:orderId/accept
const acceptDelivery = async (req, res) => {
  const delivery = await Delivery.findOneAndUpdate(
    { orderId: req.params.orderId, partnerId: req.user.id, status: 'assigned' },
    { status: 'accepted', acceptedAt: new Date() },
    { new: true }
  );
  if (!delivery) return res.status(404).json({ success: false, error: { message: 'Delivery not found or already accepted' } });

  await publishEvent('delivery.accepted', { orderId: delivery.orderId, partnerId: req.user.id });
  res.json({ success: true, data: { delivery } });
};

// PATCH /api/delivery/:orderId/reject
const rejectDelivery = async (req, res) => {
  await Delivery.findOneAndUpdate(
    { orderId: req.params.orderId, partnerId: req.user.id },
    { status: 'rejected', partnerId: null }
  );
  await DeliveryPartner.findOneAndUpdate({ userId: req.user.id }, { isAvailable: true });
  res.json({ success: true, message: 'Delivery rejected' });
};

// PATCH /api/delivery/:orderId/pickup
const markPickedUp = async (req, res) => {
  const delivery = await Delivery.findOneAndUpdate(
    { orderId: req.params.orderId, partnerId: req.user.id, status: 'accepted' },
    { status: 'picked_up', pickedUpAt: new Date() },
    { new: true }
  );
  if (!delivery) return res.status(404).json({ success: false, error: { message: 'Delivery not found' } });

  await publishEvent('delivery.picked_up', { orderId: delivery.orderId, partnerId: req.user.id });
  res.json({ success: true, data: { delivery } });
};

// PATCH /api/delivery/:orderId/deliver
const markDelivered = async (req, res) => {
  const { otp } = req.body;
  const delivery = await Delivery.findOne({ orderId: req.params.orderId, partnerId: req.user.id, status: 'picked_up' });
  if (!delivery) return res.status(404).json({ success: false, error: { message: 'Delivery not found' } });

  if (delivery.otp !== otp) return res.status(400).json({ success: false, error: { message: 'Invalid delivery OTP', code: 'INVALID_OTP' } });

  delivery.status = 'delivered';
  delivery.deliveredAt = new Date();
  await delivery.save();

  await DeliveryPartner.findOneAndUpdate(
    { userId: req.user.id },
    { isAvailable: true, $inc: { totalDeliveries: 1, totalEarnings: delivery.earnings, todayEarnings: delivery.earnings } }
  );

  await publishEvent('delivery.completed', { orderId: delivery.orderId, partnerId: req.user.id });
  res.json({ success: true, message: 'Delivery completed', data: { delivery } });
};

// GET /api/delivery/partner/history
const getDeliveryHistory = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const [deliveries, total] = await Promise.all([
    Delivery.find({ partnerId: req.user.id, status: 'delivered' }).sort({ deliveredAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
    Delivery.countDocuments({ partnerId: req.user.id, status: 'delivered' }),
  ]);
  res.json({ success: true, data: { deliveries, meta: { total, page: +page, totalPages: Math.ceil(total / limit) } } });
};

// GET /api/delivery/partner/earnings
const getEarnings = async (req, res) => {
  const partner = await DeliveryPartner.findOne({ userId: req.user.id });
  if (!partner) return res.status(404).json({ success: false, error: { message: 'Partner not found' } });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayDeliveries = await Delivery.countDocuments({ partnerId: req.user.id, deliveredAt: { $gte: today } });

  res.json({ success: true, data: { totalEarnings: partner.totalEarnings, todayEarnings: partner.todayEarnings, totalDeliveries: partner.totalDeliveries, todayDeliveries } });
};

module.exports = { registerPartner, getMyProfile, updateLocation, toggleOnline, assignDelivery, getActiveDelivery, acceptDelivery, rejectDelivery, markPickedUp, markDelivered, getDeliveryHistory, getEarnings };
