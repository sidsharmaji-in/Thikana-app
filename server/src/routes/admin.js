/**
 * GharDekho — Admin Console & Moderation Routes (Slice P12)
 * High-privilege routes for platform operations:
 *  - Listing Moderation & Shield Verification Badge Approval
 *  - DigiLocker Aadhaar KYC Audit & Verification Approval
 *  - Escrow Advance & Token Payment Audit Ledger
 */

const express = require('express');
const router = express.Router();
const repository = require('../data/repository');
const { paymentService } = require('../services/paymentService');

// Middleware to enforce Admin role
function requireAdmin(req, res, next) {
  const adminKey = req.headers['x-admin-key'];
  const userRole = req.headers['x-user-role'];

  // Valid if provided admin secret header or authenticated user has role=admin
  if (adminKey === 'ghardekho-super-admin-secret-2026' || userRole === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    error: 'ADMIN_ACCESS_REQUIRED',
    message: 'Forbidden: Super Admin credentials required'
  });
}

// GET /api/admin/overview - Platform ops KPIs
router.get('/overview', requireAdmin, (req, res) => {
  const properties = repository.getProperties({});
  const verifiedCount = properties.filter((p) => p.isVerified).length;
  const unverifiedCount = properties.length - verifiedCount;

  res.json({
    success: true,
    data: {
      totalListings: properties.length,
      verifiedListings: verifiedCount,
      pendingVerification: unverifiedCount,
      escrowOrdersCount: paymentService.orders.size,
      paymentsCount: paymentService.payments.size,
      systemStatus: 'Operational'
    }
  });
});

// GET /api/admin/pending-listings - Inspect unverified landlord listings
router.get('/pending-listings', requireAdmin, (req, res) => {
  const properties = repository.getProperties({});
  const pending = properties.filter((p) => !p.isVerified);
  res.json({
    success: true,
    count: pending.length,
    listings: pending
  });
});

// POST /api/admin/listings/:id/approve - Approve listing and grant Shield Verification badge
router.post('/listings/:id/approve', requireAdmin, (req, res) => {
  const property = repository.getPropertyById(req.params.id);
  if (!property) {
    return res.status(404).json({ success: false, error: 'PROPERTY_NOT_FOUND', message: 'Property not found' });
  }

  property.isAvailable = true;
  property.isVerified = true;
  property.verificationBadge = 'GharDekho Shield Verified 🛡️';
  delete property.rejectionReason;

  res.json({
    success: true,
    message: 'Listing approved and granted GharDekho Shield Verified status',
    property
  });
});

// POST /api/admin/listings/:id/reject - Reject or flag listing
router.post('/listings/:id/reject', requireAdmin, (req, res) => {
  const { reason } = req.body;
  const property = repository.getPropertyById(req.params.id);
  if (!property) {
    return res.status(404).json({ success: false, error: 'PROPERTY_NOT_FOUND', message: 'Property not found' });
  }

  property.isAvailable = false;
  property.isVerified = false;
  property.rejectionReason = reason || 'Failed physical verification check';

  res.json({
    success: true,
    message: 'Listing paused and rejected with feedback',
    property
  });
});

// GET /api/admin/payments/escrow - Inspect all ₹500 token advance transactions
router.get('/payments/escrow', requireAdmin, (req, res) => {
  const list = [];
  paymentService.payments.forEach((payment, paymentId) => {
    list.push({
      paymentId,
      ...payment
    });
  });

  res.json({
    success: true,
    count: list.length,
    payments: list
  });
});

module.exports = { adminRouter: router, requireAdmin };
