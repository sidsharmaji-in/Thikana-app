// Slice P3: Real-Time Communication & Concurrency Bed Locks Automated Tests
const http = require('http');
const WebSocket = require('ws');
const realtimeHub = require('../src/realtime/hub');
const bedLockService = require('../src/services/bedLockService');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

function request(apiPath, options = {}, data = null) {
  const reqOptions = {
    hostname: '127.0.0.1',
    port: 4000,
    path: apiPath,
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-bypass-rate-limit': 'test',
      ...(options.headers || {})
    }
  };
  return makeRequest(reqOptions, data);
}

async function runTests() {
  console.log('🧪 Starting Slice P3: Real-Time Engine & Concurrency Bed Locks Tests...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    const propId = 'prop-kota-01';
    const roomId = 'room-k1';
    const slotId = 's4'; // Bed D in 4-Bed Room (Available Slot)

    // Ensure slot starts clean and unlocked
    await request(`/api/properties/${propId}/rooms/${roomId}/slots/${slotId}/status`, {
      method: 'PUT'
    }, { status: 'available' });
    bedLockService.releaseLock(propId, roomId, slotId, 'owner');

    // 1. Bed Slot Temporary Lock Acquisition (10-min lease hold)
    const lockRes = await request(`/api/properties/${propId}/rooms/${roomId}/slots/${slotId}/lock`, {
      method: 'POST'
    }, {
      lockedBy: 'student-aryan-01',
      tenantName: 'Aryan Sharma',
      tenantPhone: '+919829011111',
      leaseSeconds: 600
    });

    assert(lockRes.status === 200, 'POST .../slots/:slotId/lock responds with 200 OK');
    assert(lockRes.data.success === true, 'Lock acquisition reports success = true');
    assert(lockRes.data.lock.lockedBy === 'student-aryan-01', 'Lock holds student identifier');
    assert(lockRes.data.lock.remainingSeconds === 600, 'Lock grants 600s (10-minute) reservation lease hold');

    // 2. Concurrency Double-Booking Race Interception
    // Simulate competitor student trying to lock the exact same bed slot while locked
    const competitorLockRes = await request(`/api/properties/${propId}/rooms/${roomId}/slots/${slotId}/lock`, {
      method: 'POST'
    }, {
      lockedBy: 'student-rohit-02',
      tenantName: 'Rohit Verma',
      tenantPhone: '+919829022222'
    });

    assert(competitorLockRes.status === 409, 'Competitor reservation attempt intercepted with HTTP 409 Conflict');
    assert(competitorLockRes.data.error === 'SLOT_TEMPORARILY_LOCKED', 'Reports error: SLOT_TEMPORARILY_LOCKED');
    assert(typeof competitorLockRes.data.remainingSeconds === 'number', 'Returns remaining lease seconds to competitor');
    assert(competitorLockRes.headers['retry-after'] !== undefined, 'Returns standard HTTP Retry-After header');

    // 3. Same-User Lease Refresh
    const refreshLockRes = await request(`/api/properties/${propId}/rooms/${roomId}/slots/${slotId}/lock`, {
      method: 'POST'
    }, {
      lockedBy: 'student-aryan-01',
      leaseSeconds: 600
    });
    assert(refreshLockRes.status === 200, 'Same student can refresh/extend their active lock lease');
    assert(refreshLockRes.data.refreshed === true, 'Response confirms refreshed: true');

    // 4. GET Lock Status
    const statusResForAryan = await request(`/api/properties/${propId}/rooms/${roomId}/slots/${slotId}/lock-status?currentUserId=student-aryan-01`);
    assert(statusResForAryan.status === 200, 'GET .../lock-status responds with 200 OK');
    assert(statusResForAryan.data.isLocked === true, 'Reports slot is locked');
    assert(statusResForAryan.data.lockedByMe === true, 'Identifies lockedByMe = true for Aryan');

    const statusResForRohit = await request(`/api/properties/${propId}/rooms/${roomId}/slots/${slotId}/lock-status?currentUserId=student-rohit-02`);
    assert(statusResForRohit.data.lockedByMe === false, 'Identifies lockedByMe = false for Rohit');

    // 5. Booking Guard: Competitor blocked from booking locked bed
    const competitorBookingRes = await request(`/api/properties/${propId}/book-slot`, {
      method: 'POST'
    }, {
      roomId,
      slotId,
      tenantName: 'Rohit Verma',
      tenantPhone: '+919829022222',
      lockedBy: 'student-rohit-02'
    });
    assert(competitorBookingRes.status === 409, 'Direct booking intercepted by lock with HTTP 409 Conflict');
    assert(competitorBookingRes.data.error === 'SLOT_TEMPORARILY_LOCKED', 'Prevents competitor from stealing locked bed');

    // 6. Early Lock Release & Authorization
    const unauthorizedReleaseRes = await request(`/api/properties/${propId}/rooms/${roomId}/slots/${slotId}/release-lock`, {
      method: 'POST'
    }, {
      requestedBy: 'stranger-99'
    });
    assert(unauthorizedReleaseRes.status === 403, 'Unauthorized third-party cannot release another student bed lock (HTTP 403)');

    const authorizedReleaseRes = await request(`/api/properties/${propId}/rooms/${roomId}/slots/${slotId}/release-lock`, {
      method: 'POST'
    }, {
      requestedBy: 'student-aryan-01'
    });
    assert(authorizedReleaseRes.status === 200, 'Reserving student successfully releases bed lock early (HTTP 200)');

    // Now Rohit can acquire the vacant bed lock
    const rohitNewLockRes = await request(`/api/properties/${propId}/rooms/${roomId}/slots/${slotId}/lock`, {
      method: 'POST'
    }, {
      lockedBy: 'student-rohit-02',
      tenantName: 'Rohit Verma'
    });
    assert(rohitNewLockRes.status === 200, 'Released bed can now be acquired by competitor');

    // Rohit completes booking -> lock is consumed and slot permanently marked
    const rohitConfirmBooking = await request(`/api/properties/${propId}/book-slot`, {
      method: 'POST'
    }, {
      roomId,
      slotId,
      tenantName: 'Rohit Verma',
      tenantPhone: '+919829022222',
      lockedBy: 'student-rohit-02'
    });
    assert(rohitConfirmBooking.status === 200, 'Legitimate lock holder confirms booking successfully');
    assert(rohitConfirmBooking.data.slot.status === 'occupied', 'Slot permanently transitioned to occupied');

    // Clean up test bed slot back to available for subsequent test suite runs
    await request(`/api/properties/${propId}/rooms/${roomId}/slots/${slotId}/status`, {
      method: 'PUT'
    }, {
      status: 'available'
    });

    // 7. Real-Time WebSocket Pub/Sub Connection Test
    const ws = new WebSocket('ws://localhost:4000');
    let wsConnected = false;
    let wsSubscribed = false;
    let receivedEvents = [];

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => resolve(), 3000);

      ws.on('open', () => {
        wsConnected = true;
        // Subscribe to chat and property channel
        ws.send(JSON.stringify({
          action: 'subscribe',
          channels: ['chat:inq-101', `property:${propId}`]
        }));
      });

      ws.on('message', (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.event === 'subscribed') {
            wsSubscribed = true;
            resolve();
          } else {
            receivedEvents.push(parsed);
          }
        } catch (e) {}
      });

      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    assert(wsConnected === true, 'WebSocket connection established to ws://localhost:4000');
    assert(wsSubscribed === true, 'WebSocket successfully subscribed to chat:inq-101 and property channels');

    // 8. Real-Time Event Dispatch via Chat Message API
    const testMsgRes = await request('/api/inquiries/inq-101/messages', {
      method: 'POST'
    }, {
      senderRole: 'tenant',
      senderName: 'Vikas Meena',
      text: 'Real-time WebSocket sync verification message 🚀'
    });
    assert(testMsgRes.status === 201, 'POST /api/inquiries/inq-101/messages creates message');

    // Wait 200ms for event to travel over WebSocket
    await new Promise(r => setTimeout(r, 200));

    const chatEvent = receivedEvents.find(e => e.channel === 'chat:inq-101' && e.event === 'chat:message');
    assert(chatEvent !== undefined, 'WebSocket received real-time chat:message broadcast event');
    assert(chatEvent.data.message.text.includes('Real-time WebSocket sync'), 'Event contains published message payload');

    // 9. Real-Time Typing Indicator over WebSocket
    ws.send(JSON.stringify({
      action: 'typing',
      channel: 'chat:inq-101',
      isTyping: true,
      user: 'Vikas Meena'
    }));
    await new Promise(r => setTimeout(r, 150));

    const typingEvent = receivedEvents.find(e => e.event === 'chat:typing');
    assert(typingEvent !== undefined, 'WebSocket broadcasted chat:typing indicator');
    assert(typingEvent.data.isTyping === true, 'Typing state confirmed');

    // 10. Real-Time Hub Stats & Clean Disconnect
    const statsRes = await request('/api/realtime/stats');
    assert(statsRes.status === 200, 'GET /api/realtime/stats responds with 200 OK');
    assert(statsRes.data.stats.totalClients >= 1, 'Realtime stats tracks active client connections');

    ws.close();

    console.log(`\n📊 Results: ${passed} Passed, ${failed} Failed`);
    if (failed === 0) {
      console.log('⚡ All Slice P3 Real-Time Communication & Concurrency Bed Locks tests passed successfully!\n');
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
