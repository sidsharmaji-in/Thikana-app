const express = require('express');
const router = express.Router();
const repository = require('../data/repository');
const { sanitizeInput } = require('../middleware/sanitizer');

// GET /api/notifications - Notification center feed
router.get('/', (req, res) => {
  const { role = 'tenant', unreadOnly } = req.query;
  const { list, unreadCount } = repository.getNotifications({ role, unreadOnly });

  res.json({
    success: true,
    count: list.length,
    unreadCount,
    notifications: list
  });
});

// GET /api/notifications/preferences - Notification settings
router.get('/preferences', (req, res) => {
  res.json({
    success: true,
    preferences: repository.getPreferences()
  });
});

// PUT /api/notifications/preferences - Update notification settings
router.put('/preferences', (req, res) => {
  const updated = repository.updatePreferences(req.body || {});
  res.json({
    success: true,
    preferences: updated,
    message: 'Notification preferences updated successfully'
  });
});

// POST /api/notifications/:id/mark-read - Mark single notification as read
router.post('/:id/mark-read', (req, res) => {
  const result = repository.markNotificationRead(req.params.id);
  if (!result) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  res.json({
    success: true,
    notification: result.notification,
    unreadCount: result.unreadCount,
    message: 'Notification marked as read'
  });
});

// POST /api/notifications/mark-all-read - Mark all notifications as read
router.post('/mark-all-read', (req, res) => {
  const { role = 'tenant' } = req.body || {};
  const markedCount = repository.markAllNotificationsRead(role);

  res.json({
    success: true,
    markedCount,
    unreadCount: 0,
    message: 'All notifications marked as read'
  });
});

// POST /api/notifications/send - Dispatch / trigger new notification
router.post('/send', (req, res) => {
  const { recipientRole, recipientPhone, type, title, body, entityType, entityId, propertyId, actionLabel, priority } = req.body;

  if (!recipientRole || !title || !body) {
    return res.status(400).json({ success: false, message: 'recipientRole, title, and body are required' });
  }

  const cleanTitle = sanitizeInput(title);
  const cleanBody = sanitizeInput(body);

  const notif = repository.createNotification({
    recipientRole,
    recipientPhone,
    type: type || 'general',
    title: cleanTitle,
    body: cleanBody,
    entityType,
    entityId,
    propertyId,
    actionLabel,
    priority: priority || 'normal'
  });

  res.status(201).json({
    success: true,
    notification: notif,
    message: 'Notification dispatched successfully'
  });
});

module.exports = router;

