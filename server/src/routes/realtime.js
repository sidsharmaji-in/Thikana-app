// Real-Time SSE & Pub/Sub Router (Slice P3 Production Architecture)
const express = require('express');
const router = express.Router();
const realtimeHub = require('../realtime/hub');

// GET /api/realtime/stream - Server-Sent Events (SSE) stream endpoint
router.get('/stream', (req, res) => {
  const clientId = `client-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const channelsParam = req.query.channels || '';
  const channels = channelsParam
    ? channelsParam.split(',').map(c => c.trim()).filter(Boolean)
    : ['global'];

  // Establish SSE HTTP headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Send function for this client
  const sendEvent = (msg) => {
    res.write(`data: ${JSON.stringify(msg)}\n\n`);
  };

  // Subscribe client to all requested channels
  for (const channel of channels) {
    realtimeHub.subscribe(channel, clientId, sendEvent);
  }

  // Welcome payload
  sendEvent({
    type: 'connection_established',
    clientId,
    subscribedChannels: channels,
    timestamp: new Date().toISOString()
  });

  // Keep-alive heartbeat ping every 25 seconds to prevent proxy dropouts
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 25000);

  // Clean disconnect on client abort
  req.on('close', () => {
    clearInterval(heartbeat);
    realtimeHub.disconnect(clientId);
  });
});

// POST /api/realtime/broadcast - Emit message to channel subscribers
router.post('/broadcast', (req, res) => {
  const { channel, event, data } = req.body;

  if (!channel || !event) {
    return res.status(400).json({
      success: false,
      message: 'channel and event are required'
    });
  }

  const deliveredCount = realtimeHub.broadcast(channel, event, data || {});

  res.status(200).json({
    success: true,
    channel,
    event,
    deliveredCount,
    message: `Broadcast delivered to ${deliveredCount} subscriber(s)`
  });
});

// GET /api/realtime/stats - Live subscriber and channel metrics
router.get('/stats', (req, res) => {
  const stats = realtimeHub.getStats();
  res.status(200).json({
    success: true,
    stats
  });
});

module.exports = router;
