const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/asyncHandler');
const {
  getPublicRestaurants, getPublicRestaurantById, createRestaurant, getMyRestaurant,
  updateRestaurant, addMenuItem, updateMenuItem, deleteMenuItem, toggleOpen,
  getAllRestaurants, verifyRestaurant,
} = require('../controllers/restaurantController');

// Upload service is optional — only loads if @supabase/supabase-js is installed
let upload, uploadToSupabase;
try {
  ({ upload, uploadToSupabase } = require('../services/uploadService'));
} catch (e) {
  console.warn('[restaurant-service] Upload service unavailable:', e.message);
}

const router = express.Router();

// Image upload (only register if upload service loaded)
if (upload && uploadToSupabase) {
  router.post('/upload', authMiddleware(['restaurant_owner', 'admin']), upload.single('image'), asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, error: { message: 'No file provided' } });
    const url = await uploadToSupabase(req.file, 'restaurants');
    res.json({ success: true, data: { url } });
  }));
}

// Public
router.get('/public',     asyncHandler(getPublicRestaurants));
router.get('/public/:id', asyncHandler(getPublicRestaurantById));

// Owner
router.post('/',                    authMiddleware(['restaurant_owner']),  asyncHandler(createRestaurant));
router.get('/my',                   authMiddleware(['restaurant_owner']),  asyncHandler(getMyRestaurant));
router.put('/:id',                  authMiddleware(['restaurant_owner']),  asyncHandler(updateRestaurant));
router.post('/:id/menu',            authMiddleware(['restaurant_owner']),  asyncHandler(addMenuItem));
router.put('/:id/menu/:itemId',     authMiddleware(['restaurant_owner']),  asyncHandler(updateMenuItem));
router.delete('/:id/menu/:itemId',  authMiddleware(['restaurant_owner']),  asyncHandler(deleteMenuItem));
router.patch('/:id/toggle-open',    authMiddleware(['restaurant_owner']),  asyncHandler(toggleOpen));

// Admin
router.get('/',              authMiddleware(['admin', 'super_admin']), asyncHandler(getAllRestaurants));
router.patch('/:id/verify',  authMiddleware(['admin', 'super_admin']), asyncHandler(verifyRestaurant));

module.exports = router;
