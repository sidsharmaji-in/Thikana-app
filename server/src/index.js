// GharDekho Server Entry Point (Slice P1 Modular + Slice P3 Real-Time WebSocket)
const { WebSocketServer } = require('ws');
const app = require('./app');
const realtimeHub = require('./realtime/hub');

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, () => {
  console.log(`🏠 GharDekho Server running on http://localhost:${PORT}`);
  console.log(`✨ Mix A+C Design System active (Dark Slate + Saffron Orange)`);
});

// Attach WebSocket Server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  const clientId = `ws-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  const sendFn = (msg) => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  };

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.action === 'subscribe') {
        const channels = Array.isArray(msg.channels) ? msg.channels : [msg.channel];
        for (const ch of channels) {
          if (ch) realtimeHub.subscribe(ch, clientId, sendFn);
        }
        ws.send(JSON.stringify({ event: 'subscribed', channels, clientId }));
      } else if (msg.action === 'unsubscribe') {
        const channels = Array.isArray(msg.channels) ? msg.channels : [msg.channel];
        for (const ch of channels) {
          if (ch) realtimeHub.unsubscribe(ch, clientId);
        }
      } else if (msg.action === 'typing') {
        realtimeHub.broadcast(msg.channel, 'chat:typing', {
          isTyping: Boolean(msg.isTyping),
          user: msg.user || 'Participant'
        });
      } else if (msg.action === 'read') {
        realtimeHub.broadcast(msg.channel, 'chat:read_receipt', {
          messageId: msg.messageId,
          readAt: new Date().toISOString()
        });
      }
    } catch (e) {}
  });

  ws.on('close', () => {
    realtimeHub.disconnect(clientId);
  });
});

module.exports = server;
