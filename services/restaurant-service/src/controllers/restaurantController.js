const Restaurant = require('../models/Restaurant');
const { getRedis } = require('../services/redisService');

const CACHE_TTL = 300; // 5 minutes

// GET /api/restaurants/public - public listing
const getPublicRestaurants = async (req, res) => {
  const { city, cuisine, category, search, page = 1, limit = 20, sort = 'rating' } = req.query;
  const cacheKey = `restaurants:${city}:${cuisine}:${category}:${search}:${page}:${sort}`;

  const redis = getRedis();
  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
  }

  const filter = { isActive: true };
  if (city) filter['address.city'] = new RegExp(city, 'i');
  if (cuisine) filter.cuisine = { $in: [new RegExp(cuisine, 'i')] };
  if (category) filter.category = category;
  if (search) filter.$text = { $search: search };

  const sortMap = { rating: { rating: -1 }, popular: { totalOrders: -1 }, delivery_time: { deliveryTime: 1 }, new: { createdAt: -1 } };
  const sortQuery = sortMap[sort] || { rating: -1 };

  const [restaurants, total] = await Promise.all([
    Restaurant.find(filter, '-bankDetails -ownerId').sort(sortQuery).skip((page - 1) * limit).limit(parseInt(limit)),
    Restaurant.countDocuments(filter),
  ]);

  const result = { success: true, data: { restaurants, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) } } };

  if (redis) await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
  res.json(result);
};

// GET /api/restaurants/public/:id
const getPublicRestaurantById = async (req, res) => {
  const redis = getRedis();
  const cacheKey = `restaurant:${req.params.id}`;

  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
  }

  const restaurant = await Restaurant.findById(req.params.id, '-bankDetails');
  if (!restaurant) return res.status(404).json({ success: false, error: { message: 'Restaurant not found' } });

  const result = { success: true, data: { restaurant } };
  if (redis) await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
  res.json(result);
};

// POST /api/restaurants - create restaurant
const createRestaurant = async (req, res) => {
  const existing = await Restaurant.findOne({ ownerId: req.user.id });
  if (existing) return res.status(409).json({ success: false, error: { message: 'You already have a restaurant', code: 'RESTAURANT_EXISTS' } });

  const restaurant = await Restaurant.create({ ...req.body, ownerId: req.user.id });
  res.status(201).json({ success: true, message: 'Restaurant created successfully', data: { restaurant } });
};

// GET /api/restaurants/my - owner's restaurant
const getMyRestaurant = async (req, res) => {
  const restaurant = await Restaurant.findOne({ ownerId: req.user.id });
  if (!restaurant) return res.status(404).json({ success: false, error: { message: 'No restaurant found' } });
  res.json({ success: true, data: { restaurant } });
};

// PUT /api/restaurants/:id - update restaurant
const updateRestaurant = async (req, res) => {
  const restaurant = await Restaurant.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.user.id },
    { $set: req.body },
    { new: true, runValidators: true }
  );
  if (!restaurant) return res.status(404).json({ success: false, error: { message: 'Restaurant not found or unauthorized' } });

  const redis = getRedis();
  if (redis) await redis.del(`restaurant:${req.params.id}`);

  res.json({ success: true, data: { restaurant } });
};

// POST /api/restaurants/:id/menu - add menu item
const addMenuItem = async (req, res) => {
  const restaurant = await Restaurant.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.user.id },
    { $push: { menu: req.body } },
    { new: true }
  );
  if (!restaurant) return res.status(404).json({ success: false, error: { message: 'Restaurant not found' } });

  const redis = getRedis();
  if (redis) await redis.del(`restaurant:${req.params.id}`);

  res.status(201).json({ success: true, data: { menu: restaurant.menu } });
};

// PUT /api/restaurants/:id/menu/:itemId - update menu item
const updateMenuItem = async (req, res) => {
  const update = {};
  Object.keys(req.body).forEach((key) => { update[`menu.$.${key}`] = req.body[key]; });

  const restaurant = await Restaurant.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.user.id, 'menu._id': req.params.itemId },
    { $set: update },
    { new: true }
  );
  if (!restaurant) return res.status(404).json({ success: false, error: { message: 'Item not found' } });

  const redis = getRedis();
  if (redis) await redis.del(`restaurant:${req.params.id}`);

  res.json({ success: true, data: { menu: restaurant.menu } });
};

// DELETE /api/restaurants/:id/menu/:itemId
const deleteMenuItem = async (req, res) => {
  const restaurant = await Restaurant.findOneAndUpdate(
    { _id: req.params.id, ownerId: req.user.id },
    { $pull: { menu: { _id: req.params.itemId } } },
    { new: true }
  );
  if (!restaurant) return res.status(404).json({ success: false, error: { message: 'Restaurant not found' } });

  const redis = getRedis();
  if (redis) await redis.del(`restaurant:${req.params.id}`);

  res.json({ success: true, message: 'Menu item deleted' });
};

// PATCH /api/restaurants/:id/toggle-open
const toggleOpen = async (req, res) => {
  const restaurant = await Restaurant.findOne({ _id: req.params.id, ownerId: req.user.id });
  if (!restaurant) return res.status(404).json({ success: false, error: { message: 'Restaurant not found' } });

  restaurant.isOpen = !restaurant.isOpen;
  await restaurant.save();
  res.json({ success: true, data: { isOpen: restaurant.isOpen } });
};

// Admin: GET /api/restaurants - all restaurants
const getAllRestaurants = async (req, res) => {
  const { page = 1, limit = 20, isVerified, isActive } = req.query;
  const filter = {};
  if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const [restaurants, total] = await Promise.all([
    Restaurant.find(filter, '-bankDetails').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
    Restaurant.countDocuments(filter),
  ]);
  res.json({ success: true, data: { restaurants, meta: { total, page: +page, totalPages: Math.ceil(total / limit) } } });
};

// Admin: PATCH /api/restaurants/:id/verify
const verifyRestaurant = async (req, res) => {
  const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, { isVerified: true, isActive: true }, { new: true });
  if (!restaurant) return res.status(404).json({ success: false, error: { message: 'Restaurant not found' } });
  res.json({ success: true, message: 'Restaurant verified', data: { restaurant } });
};

module.exports = { getPublicRestaurants, getPublicRestaurantById, createRestaurant, getMyRestaurant, updateRestaurant, addMenuItem, updateMenuItem, deleteMenuItem, toggleOpen, getAllRestaurants, verifyRestaurant };
