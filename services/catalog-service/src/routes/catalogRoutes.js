const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/asyncHandler');
const { getFoods, getFoodById, getCategories, getTrending, searchFoods, createFood, updateFood, deleteFood } = require('../controllers/catalogController');

const router = express.Router();

// Public
router.get('/foods',        asyncHandler(getFoods));
router.get('/foods/:id',    asyncHandler(getFoodById));
router.get('/categories',   asyncHandler(getCategories));
router.get('/trending',     asyncHandler(getTrending));
router.get('/search',       asyncHandler(searchFoods));

// Protected
router.post('/foods',       authMiddleware(['restaurant_owner', 'admin']), asyncHandler(createFood));
router.put('/foods/:id',    authMiddleware(['restaurant_owner', 'admin']), asyncHandler(updateFood));
router.delete('/foods/:id', authMiddleware(['restaurant_owner', 'admin']), asyncHandler(deleteFood));

module.exports = router;
