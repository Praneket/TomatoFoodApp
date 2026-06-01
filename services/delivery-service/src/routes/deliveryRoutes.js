const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/asyncHandler');
const {
  registerPartner, getMyProfile, updateLocation, toggleOnline,
  assignDelivery, getActiveDelivery, acceptDelivery, rejectDelivery,
  markPickedUp, markDelivered, getDeliveryHistory, getEarnings,
} = require('../controllers/deliveryController');

const router = express.Router();

router.post('/partner/register',          authMiddleware(['delivery_partner']), asyncHandler(registerPartner));
router.get('/partner/me',                 authMiddleware(['delivery_partner']), asyncHandler(getMyProfile));
router.patch('/partner/location',         authMiddleware(['delivery_partner']), asyncHandler(updateLocation));
router.patch('/partner/toggle-online',    authMiddleware(['delivery_partner']), asyncHandler(toggleOnline));
router.get('/partner/history',            authMiddleware(['delivery_partner']), asyncHandler(getDeliveryHistory));
router.get('/partner/earnings',           authMiddleware(['delivery_partner']), asyncHandler(getEarnings));
router.get('/active',                     authMiddleware(['delivery_partner']), asyncHandler(getActiveDelivery));
router.patch('/:orderId/accept',          authMiddleware(['delivery_partner']), asyncHandler(acceptDelivery));
router.patch('/:orderId/reject',          authMiddleware(['delivery_partner']), asyncHandler(rejectDelivery));
router.patch('/:orderId/pickup',          authMiddleware(['delivery_partner']), asyncHandler(markPickedUp));
router.patch('/:orderId/deliver',         authMiddleware(['delivery_partner']), asyncHandler(markDelivered));
router.post('/assign',                    authMiddleware(['admin', 'super_admin']), asyncHandler(assignDelivery));

module.exports = router;
