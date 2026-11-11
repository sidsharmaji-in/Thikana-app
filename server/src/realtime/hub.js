// Unified Real-Time Pub/Sub Hub (Slice P3 Production Architecture)
// Supports WebSocket (ws) and Server-Sent Events (SSE) Transports

const EventEmitter = require('events');

class RealtimeHub extends EventEmitter {
  constructor() {
    super();
    // channelName -> Map(clientId -> sendFunction)
    this.channels = new Map();
    // clientId -> Set(channelNames)
    this.clientSubscriptions = new Map();
    this.clientCount = 0;
  }

  // Register client subscription to a channel
  subscribe(channel, clientId, sendFn) {
    if (!channel || !clientId || typeof sendFn !== 'function') return false;

    if (!this.channels.has(channel)) {
      this.channels.set(channel, new Map());
    }
    this.channels.get(channel).set(clientId, sendFn);

    if (!this.clientSubscriptions.has(clientId)) {
      this.clientSubscriptions.set(clientId, new Set());
      this.clientCount++;
    }
    this.clientSubscriptions.get(clientId).add(channel);

    return true;
  }

  // Unsubscribe client from a channel
  unsubscribe(channel, clientId) {
    if (this.channels.has(channel)) {
      this.channels.get(channel).delete(clientId);
      if (this.channels.get(channel).size === 0) {
        this.channels.delete(channel);
      }
    }

    if (this.clientSubscriptions.has(clientId)) {
      this.clientSubscriptions.get(clientId).delete(channel);
    }
  }

  // Remove client from all channels on disconnect
  disconnect(clientId) {
    if (!this.clientSubscriptions.has(clientId)) return;

    const subscribedChannels = this.clientSubscriptions.get(clientId);
    for (const ch of subscribedChannels) {
      if (this.channels.has(ch)) {
        this.channels.get(ch).delete(clientId);
        if (this.channels.get(ch).size === 0) {
          this.channels.delete(ch);
        }
      }
    }

    this.clientSubscriptions.delete(clientId);
    this.clientCount = Math.max(0, this.clientCount - 1);
  }

  // Broadcast message to all subscribers in a channel
  broadcast(channel, event, data = {}) {
    const message = {
      channel,
      event,
      data,
      timestamp: new Date().toISOString()
    };

    // Emit on internal EventEmitter (for in-process listeners)
    this.emit(channel, message);
    this.emit('*', message);

    if (!this.channels.has(channel)) return 0;

    const subscribers = this.channels.get(channel);
    let sentCount = 0;

    for (const [clientId, sendFn] of subscribers.entries()) {
      try {
        sendFn(message);
        sentCount++;
      } catch (err) {
        console.warn(`[RealtimeHub] Failed to send to ${clientId}:`, err.message);
        this.unsubscribe(channel, clientId);
      }
    }

    return sentCount;
  }

  // Channel subscriber count
  getSubscriberCount(channel) {
    return this.channels.has(channel) ? this.channels.get(channel).size : 0;
  }

  // Active metrics summary
  getStats() {
    const activeChannels = {};
    for (const [ch, subs] of this.channels.entries()) {
      activeChannels[ch] = subs.size;
    }

    return {
      totalClients: this.clientSubscriptions.size,
      channelCount: this.channels.size,
      channels: activeChannels
    };
  }

  // Helper to reset state for testing
  _reset() {
    this.channels.clear();
    this.clientSubscriptions.clear();
    this.clientCount = 0;
  }
}

// Global Singleton Hub
const realtimeHub = new RealtimeHub();

module.exports = realtimeHub;

