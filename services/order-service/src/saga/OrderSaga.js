const { publishEvent } = require('../services/messageService');
const Order = require('../models/Order');

// ============================================================
// ORDER SAGA - Orchestration Pattern
// Steps: PlaceOrder → ReserveInventory → ProcessPayment → AssignDelivery → NotifyAll
// Compensations run in reverse on failure
// ============================================================

class OrderSaga {
  constructor(order) {
    this.order = order;
    this.completedSteps = [];
  }

  async execute() {
    try {
      await this.step_reserveInventory();
      await this.step_processPayment();
      await this.step_assignDelivery();
      await this.step_notifyParties();
      await this.updateSagaState('SAGA_COMPLETED');
    } catch (err) {
      console.error(`Saga failed at step: ${err.step}`, err.message);
      await this.compensate(err.step);
      throw err;
    }
  }

  async step_reserveInventory() {
    await this.updateSagaState('RESERVING_INVENTORY');
    await publishEvent('order.placed', {
      orderId: this.order.orderId,
      restaurantId: this.order.restaurantId,
      items: this.order.items,
    });
    this.completedSteps.push('RESERVE_INVENTORY');
  }

  async step_processPayment() {
    await this.updateSagaState('PROCESSING_PAYMENT');
    await publishEvent('payment.initiated', {
      orderId: this.order.orderId,
      userId: this.order.userId,
      amount: this.order.totalAmount,
      paymentMethod: this.order.paymentMethod,
    });
    this.completedSteps.push('PROCESS_PAYMENT');
  }

  async step_assignDelivery() {
    await this.updateSagaState('ASSIGNING_DELIVERY');
    await publishEvent('delivery.assign_request', {
      orderId: this.order.orderId,
      restaurantId: this.order.restaurantId,
      deliveryAddress: this.order.deliveryAddress,
    });
    this.completedSteps.push('ASSIGN_DELIVERY');
  }

  async step_notifyParties() {
    await this.updateSagaState('NOTIFYING');
    await publishEvent('notification.order_placed', {
      orderId: this.order.orderId,
      userId: this.order.userId,
      restaurantId: this.order.restaurantId,
      totalAmount: this.order.totalAmount,
    });
    this.completedSteps.push('NOTIFY');
  }

  async compensate(failedStep) {
    await this.updateSagaState('COMPENSATING');
    const compensations = {
      NOTIFY:            () => Promise.resolve(),
      ASSIGN_DELIVERY:   () => publishEvent('delivery.cancel', { orderId: this.order.orderId }),
      PROCESS_PAYMENT:   () => publishEvent('payment.refund', { orderId: this.order.orderId }),
      RESERVE_INVENTORY: () => publishEvent('inventory.release', { orderId: this.order.orderId, restaurantId: this.order.restaurantId }),
    };

    for (const step of [...this.completedSteps].reverse()) {
      if (compensations[step]) {
        try { await compensations[step](); } catch (e) { console.error(`Compensation failed for ${step}`, e.message); }
      }
    }

    await Order.findOneAndUpdate(
      { orderId: this.order.orderId },
      { status: 'cancelled', sagaState: 'SAGA_FAILED', cancellationReason: `Saga failed at ${failedStep}` }
    );
  }

  async updateSagaState(state) {
    await Order.findOneAndUpdate({ orderId: this.order.orderId }, { sagaState: state });
  }
}

module.exports = OrderSaga;
