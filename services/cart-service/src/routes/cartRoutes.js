const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/asyncHandler');
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart, applyCoupon, removeCoupon } = require('../controllers/cartController');

const router = express.Router();

router.get('/',                authMiddleware, asyncHandler(getCart));
router.post('/add',            authMiddleware, asyncHandler(addToCart));
router.patch('/update',        authMiddleware, asyncHandler(updateCartItem));
router.delete('/remove/:foodId', authMiddleware, asyncHandler(removeFromCart));
router.delete('/clear',        authMiddleware, asyncHandler(clearCart));
router.post('/coupon',         authMiddleware, asyncHandler(applyCoupon));
router.delete('/coupon',       authMiddleware, asyncHandler(removeCoupon));

module.exports = router;
