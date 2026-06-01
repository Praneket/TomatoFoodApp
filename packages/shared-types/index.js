// ============================================================
// TOMATO PLATFORM - Shared Types
// Used across all microservices and frontend apps
// ============================================================

// --- USER TYPES ---
export const UserRole = {
  CUSTOMER: 'customer',
  RESTAURANT_OWNER: 'restaurant_owner',
  DELIVERY_PARTNER: 'delivery_partner',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

export const OrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  PICKED_UP: 'picked_up',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

export const PaymentStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const PaymentMethod = {
  STRIPE: 'stripe',
  RAZORPAY: 'razorpay',
  COD: 'cod',
};

export const DeliveryStatus = {
  UNASSIGNED: 'unassigned',
  ASSIGNED: 'assigned',
  ACCEPTED: 'accepted',
  PICKED_UP: 'picked_up',
  DELIVERED: 'delivered',
  FAILED: 'failed',
};

// --- EVENT TYPES (RabbitMQ) ---
export const Events = {
  // Auth
  USER_REGISTERED: 'user.registered',
  USER_VERIFIED: 'user.verified',
  PASSWORD_RESET: 'user.password_reset',

  // Orders
  ORDER_PLACED: 'order.placed',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_PREPARING: 'order.preparing',
  ORDER_READY: 'order.ready',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_DELIVERED: 'order.delivered',

  // Payments
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
  REFUND_INITIATED: 'refund.initiated',
  REFUND_SUCCESS: 'refund.success',

  // Delivery
  DELIVERY_ASSIGNED: 'delivery.assigned',
  DELIVERY_ACCEPTED: 'delivery.accepted',
  DELIVERY_PICKED_UP: 'delivery.picked_up',
  DELIVERY_COMPLETED: 'delivery.completed',
  DRIVER_LOCATION_UPDATE: 'delivery.location_update',

  // Notifications
  SEND_EMAIL: 'notification.email',
  SEND_SMS: 'notification.sms',
  SEND_PUSH: 'notification.push',
};

// --- API RESPONSE ---
export const createResponse = (success, message, data = null, meta = null) => ({
  success,
  message,
  data,
  meta,
  timestamp: new Date().toISOString(),
});

export const createError = (message, code = 'INTERNAL_ERROR', details = null) => ({
  success: false,
  error: { message, code, details },
  timestamp: new Date().toISOString(),
});
