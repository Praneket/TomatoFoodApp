const express = require('express');
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/asyncHandler');
const { placeOrder, getMyOrders, getOrderById, updateOrderStatus, cancelOrder, downloadInvoice, getRestaurantOrders } = require('../controllers/orderController');

const router = express.Router();

router.post('/', authMiddleware, [
  body('restaurantId').notEmpty(),
  body('items').isArray({ min: 1 }),
  body('deliveryAddress').isObject(),
  body('paymentMethod').isIn(['stripe', 'razorpay', 'cod']),
], asyncHandler(placeOrder));

router.get('/',                              authMiddleware, asyncHandler(getMyOrders));
router.get('/:orderId',                      authMiddleware, asyncHandler(getOrderById));
router.patch('/:orderId/status',             authMiddleware, asyncHandler(updateOrderStatus));
router.post('/:orderId/cancel',              authMiddleware, asyncHandler(cancelOrder));
router.get('/:orderId/invoice',              authMiddleware, asyncHandler(downloadInvoice));
router.get('/restaurant/:restaurantId',      authMiddleware, asyncHandler(getRestaurantOrders));

module.exports = router;
