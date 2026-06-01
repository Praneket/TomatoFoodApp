const Food = require('../models/Food');
const { getRedis } = require('../services/redisService');

const CACHE_TTL = 300;

// GET /api/catalog/foods
const getFoods = async (req, res) => {
  const { category, search, isVeg, restaurantId, sort = 'popular', page = 1, limit = 20, minPrice, maxPrice } = req.query;
  const cacheKey = `catalog:foods:${JSON.stringify(req.query)}`;

  const redis = getRedis();
  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
  }

  const filter = { isAvailable: true };
  if (category) filter.category = new RegExp(category, 'i');
  if (isVeg === 'true') filter.isVeg = true;
  if (restaurantId) filter.restaurantId = restaurantId;
  if (search) filter.$text = { $search: search };
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  const sortMap = {
    popular:    { totalOrders: -1 },
    rating:     { rating: -1 },
    price_asc:  { price: 1 },
    price_desc: { price: -1 },
    new:        { createdAt: -1 },
  };

  const [foods, total] = await Promise.all([
    Food.find(filter).sort(sortMap[sort] || { totalOrders: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
    Food.countDocuments(filter),
  ]);

  const result = { success: true, data: { foods, meta: { total, page: +page, limit: +limit, totalPages: Math.ceil(total / limit) } } };
  if (redis) await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
  res.json(result);
};

// GET /api/catalog/foods/:id
const getFoodById = async (req, res) => {
  const redis = getRedis();
  const cacheKey = `catalog:food:${req.params.id}`;

  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
  }

  const food = await Food.findById(req.params.id);
  if (!food) return res.status(404).json({ success: false, error: { message: 'Food item not found' } });

  const result = { success: true, data: { food } };
  if (redis) await redis.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));
  res.json(result);
};

// GET /api/catalog/categories
const getCategories = async (req, res) => {
  const redis = getRedis();
  const cacheKey = 'catalog:categories';

  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
  }

  const categories = await Food.distinct('category', { isAvailable: true });
  const result = { success: true, data: { categories } };
  if (redis) await redis.setEx(cacheKey, 600, JSON.stringify(result));
  res.json(result);
};

// GET /api/catalog/trending
const getTrending = async (req, res) => {
  const redis = getRedis();
  const cacheKey = 'catalog:trending';

  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));
  }

  const foods = await Food.find({ isAvailable: true }).sort({ totalOrders: -1 }).limit(12);
  const result = { success: true, data: { foods } };
  if (redis) await redis.setEx(cacheKey, 300, JSON.stringify(result));
  res.json(result);
};

// GET /api/catalog/search?q=
const searchFoods = async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;
  if (!q) return res.status(400).json({ success: false, error: { message: 'Search query required' } });

  const [foods, total] = await Promise.all([
    Food.find({ $text: { $search: q }, isAvailable: true }, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .skip((page - 1) * limit)
      .limit(parseInt(limit)),
    Food.countDocuments({ $text: { $search: q }, isAvailable: true }),
  ]);

  res.json({ success: true, data: { foods, query: q, meta: { total, page: +page, totalPages: Math.ceil(total / limit) } } });
};

// POST /api/catalog/foods - admin/restaurant owner creates food
const createFood = async (req, res) => {
  const food = await Food.create(req.body);
  const redis = getRedis();
  if (redis) await redis.del('catalog:categories', 'catalog:trending');
  res.status(201).json({ success: true, data: { food } });
};

// PUT /api/catalog/foods/:id
const updateFood = async (req, res) => {
  const food = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!food) return res.status(404).json({ success: false, error: { message: 'Food not found' } });

  const redis = getRedis();
  if (redis) await redis.del(`catalog:food:${req.params.id}`);
  res.json({ success: true, data: { food } });
};

// DELETE /api/catalog/foods/:id
const deleteFood = async (req, res) => {
  await Food.findByIdAndDelete(req.params.id);
  const redis = getRedis();
  if (redis) await redis.del(`catalog:food:${req.params.id}`);
  res.json({ success: true, message: 'Food item deleted' });
};

module.exports = { getFoods, getFoodById, getCategories, getTrending, searchFoods, createFood, updateFood, deleteFood };
