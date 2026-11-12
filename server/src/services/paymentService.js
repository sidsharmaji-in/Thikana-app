/**
 * PaymentService - Razorpay Token Advance & Refund Escrow Pipeline (Slice P8)
 * Handles ₹500 refundable token advance deposits for 24-hour bed slot reservation locks.
 * Strictly verifies Razorpay HMAC-SHA256 signatures to prevent client-side payment tampering.
 */

const crypto = require('crypto');
const repository = require('../data/repository');
const bedLockService = require('./bedLockService');
const realtimeHub = require('../realtime/hub');

class PaymentService {
  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_ghardekho2026';
    this.keySecret = process.env.RAZORPAY_KEY_SECRET || 'test_secret_ghardekho_super_safe_key_99';
    
    // In-memory payment ledger: paymentId -> paymentRecord
    this.payments = new Map();
    // Orders ledger: orderId -> orderRecord
    this.orders = new Map();
  }

  /**
   * Generates a new Razorpay Order for ₹500 token advance
   * @param {Object} params
   * @param {string} params.propertyId
   * @param {string} params.roomId
   * @param {string} params.slotId
   * @param {string} params.userId
   * @param {string} params.tenantName
   * @param {string} params.tenantPhone
   * @returns {Object} Razorpay Order details
   */
  async createTokenAdvanceOrder({ propertyId, roomId, slotId, userId, tenantName, tenantPhone }) {
    if (!propertyId || !roomId || !slotId) {
      throw new Error('MISSING_SLOT_DETAILS');
    }

    const property = repository.getPropertyById(propertyId);
    if (!property) throw new Error('PROPERTY_NOT_FOUND');

    const room = (property.rooms || []).find(r => r.id === roomId);
    if (!room) throw new Error('ROOM_NOT_FOUND');

    const slot = (room.slots || []).find(s => s.slotId === slotId);
    if (!slot) throw new Error('SLOT_NOT_FOUND');

    // Verify bed slot is currently held by this user or available
    const lockStatus = bedLockService.getLockStatus(propertyId, roomId, slotId, userId);
    if (lockStatus.isLocked && !lockStatus.lockedByMe && userId) {
      throw new Error('SLOT_LOCKED_BY_ANOTHER_USER');
    }

    const orderId = `order_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const amountPaisa = 50000; // ₹500.00 in paisa
    const receipt = `rcpt_${slotId}_${Date.now().toString().slice(-6)}`;

    const orderRecord = {
      id: orderId,
      entity: 'order',
      amount: amountPaisa,
      amount_paid: 0,
      amount_due: amountPaisa,
      currency: 'INR',
      receipt,
      status: 'created',
      propertyId,
      roomId,
      slotId,
      userId: userId || `tenant-${Date.now()}`,
      tenantName: tenantName || 'Student',
      tenantPhone: tenantPhone || '',
      createdAt: new Date().toISOString()
    };

    this.orders.set(orderId, orderRecord);

    return {
      success: true,
      orderId,
      amount: amountPaisa,
      currency: 'INR',
      keyId: this.keyId,
      receipt,
      propertyName: property.title,
      roomLabel: room.label,
      slotLabel: slot.label || `Bed ${slotId.toUpperCase()}`,
      tokenAmountDisplay: '₹500.00',
      description: 'Refundable Token Advance (24-Hour Bed Slot Hold)'
    };
  }

  /**
   * Verifies Razorpay HMAC-SHA256 signature
   * @param {string} orderId
   * @param {string} paymentId
   * @param {string} signature
   * @returns {boolean}
   */
  verifySignature(orderId, paymentId, signature) {
    if (!orderId || !paymentId || !signature) return false;
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.keySecret)
      .update(body)
      .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'utf-8');
    const actualBuf = Buffer.from(signature, 'utf-8');
    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  }

  /**
   * Generate valid signature helper for mock test clients
   */
  generateTestSignature(orderId, paymentId) {
    const body = `${orderId}|${paymentId}`;
    return crypto.createHmac('sha256', this.keySecret).update(body).digest('hex');
  }

  /**
   * Confirms payment and upgrades temporary 10-minute bed lock to 24-hour verified hold
   */
  async verifyAndConfirmPayment({ orderId, paymentId, signature }) {
    if (!this.verifySignature(orderId, paymentId, signature)) {
      const err = new Error('INVALID_PAYMENT_SIGNATURE');
      err.code = 'INVALID_SIGNATURE';
      throw err;
    }

    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    if (order.status === 'paid') {
      return {
        success: true,
        alreadyProcessed: true,
        paymentId,
        orderId
      };
    }

    order.status = 'paid';
    order.amount_paid = order.amount;
    order.amount_due = 0;

    const paymentRecord = {
      paymentId,
      orderId,
      amount: order.amount / 100,
      currency: 'INR',
      status: 'captured',
      propertyId: order.propertyId,
      roomId: order.roomId,
      slotId: order.slotId,
      userId: order.userId,
      tenantName: order.tenantName,
      tenantPhone: order.tenantPhone,
      method: 'upi',
      capturedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (24 * 3600 * 1000)).toISOString(),
      receiptNumber: `GDT-${Date.now().toString().slice(-8)}`
    };

    this.payments.set(paymentId, paymentRecord);

    // Upgrade bed lock to 24 hours in bedLockService
    const upgradeResult = bedLockService.upgradeToTokenConfirmed(
      order.propertyId,
      order.roomId,
      order.slotId,
      {
        paymentId,
        orderId,
        lockedBy: order.userId,
        tenantName: order.tenantName,
        tenantPhone: order.tenantPhone
      }
    );

    // Broadcast live event to all property observers
    realtimeHub.broadcast(`property:${order.propertyId}`, 'slot:token_confirmed', {
      propertyId: order.propertyId,
      roomId: order.roomId,
      slotId: order.slotId,
      paymentId,
      expiresAt: paymentRecord.expiresAt
    });

    return {
      success: true,
      message: '₹500 Token Advance verified! Bed slot locked for 24 hours.',
      data: {
        paymentId,
        orderId,
        receiptNumber: paymentRecord.receiptNumber,
        amountPaid: '₹500.00',
        holdDuration: '24 Hours',
        expiresAt: paymentRecord.expiresAt,
        upgradeResult
      }
    };
  }

  /**
   * Automated refund execution if cancelled at least 6 hours before visit
   */
  async processRefund({ paymentId, reason = 'Student visit cancellation', hoursBeforeVisit = 12 }) {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new Error('PAYMENT_NOT_FOUND');
    }

    if (payment.status === 'refunded') {
      return { success: true, message: 'Payment is already refunded', refundId: payment.refundId };
    }

    // Enforce 6-hour policy
    if (hoursBeforeVisit < 6) {
      const err = new Error('REFUND_POLICY_BREACH');
      err.message = 'Cancellations within 6 hours of visit time forfeit the ₹500 token advance to compensate the landlord for lost holding time.';
      err.code = 'CANCELLATION_WINDOW_EXPIRED';
      throw err;
    }

    const refundId = `rfnd_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    payment.status = 'refunded';
    payment.refundId = refundId;
    payment.refundReason = reason;
    payment.refundedAt = new Date().toISOString();

    // Release the 24-hr bed lock back to available
    bedLockService.releaseLock(payment.propertyId, payment.roomId, payment.slotId, payment.userId);

    // Broadcast release
    realtimeHub.broadcast(`property:${payment.propertyId}`, 'slot:token_refunded', {
      propertyId: payment.propertyId,
      roomId: payment.roomId,
      slotId: payment.slotId,
      refundId
    });

    return {
      success: true,
      message: '₹500 Token Advance refund initiated successfully to source UPI/Bank account.',
      data: {
        refundId,
        paymentId,
        amountRefunded: '₹500.00',
        status: 'processed',
        refundedAt: payment.refundedAt
      }
    };
  }

  /**
   * Retrieves official digital payment receipt
   */
  getReceipt(paymentId) {
    const payment = this.payments.get(paymentId);
    if (!payment) return null;

    const property = repository.getPropertyById(payment.propertyId) || {};
    const room = (property.rooms || []).find(r => r.id === payment.roomId) || {};
    const slot = (room.slots || []).find(s => s.slotId === payment.slotId) || {};

    return {
      receiptNumber: payment.receiptNumber,
      paymentId: payment.paymentId,
      orderId: payment.orderId,
      amount: '500.00',
      currency: 'INR',
      gstAmount: '0.00', // Exempt refundable advance
      propertyTitle: property.title || 'Hostel Room',
      propertyCity: property.city || 'Kota',
      roomLabel: room.label || `Room ${payment.roomId}`,
      slotLabel: slot.label || `Bed ${payment.slotId.toUpperCase()}`,
      tenantName: payment.tenantName,
      tenantPhone: payment.tenantPhone,
      paidAt: payment.capturedAt,
      holdExpiresAt: payment.expiresAt,
      paymentStatus: payment.status,
      termsAndConditions: 'Refundable security token advance deposit. 100% refund credited if cancelled at least 6 hours before scheduled room visit. Subject to Rajasthan Tenancy & Consumer Protection guidelines.'
    };
  }
}

// Global Singleton Instance
const paymentService = new PaymentService();

module.exports = {
  paymentService,
  PaymentService
};
