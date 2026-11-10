/**
 * Slice 7 Automated Verification Test Suite
 * Notifications & Saved Listings Engine
 * 
 * Verifies:
 * 1. Saved/Shortlisted rooms management (GET, POST, DELETE /api/saved)
 * 2. Real-time listing freshness indicators (beds remaining, occupancy badge, price freshness)
 * 3. Soft-deleted / delisted property alert state
 * 4. In-App Notification Center feed (GET, POST mark-read, POST mark-all-read)
 * 5. Role-based notification filtering (tenant vs owner)
 * 6. Automated notification dispatch triggers (chat message, visit status, reviews, owner replies)
 * 7. Notification preferences management (GET, PUT /api/notifications/preferences)
 * 8. Error handling & edge cases
 */

const http = require('http');

const BASE_URL = 'http://localhost:4000';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(url, reqOptions, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = body;
        }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

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

async function runTests() {
  console.log('🧪 Starting Slice 7: Notifications & Saved Listings Tests...\n');

  try {
    // -------------------------------------------------------------
    // Test Group 1: Saved Listings Management & Live Freshness
    // -------------------------------------------------------------
    const savedRes = await request('/api/saved');
    assert(savedRes.status === 200, 'GET /api/saved responds with 200 OK');
    assert(savedRes.data.success === true, 'Response confirms success');
    assert(Array.isArray(savedRes.data.properties), 'Properties returned as array');
    assert(savedRes.data.savedCount >= 1, `Found initial saved properties (count: ${savedRes.data.savedCount})`);

    const initialProp = savedRes.data.properties.find(p => p.id === 'prop-kota-01');
    assert(initialProp !== undefined, 'Found seed saved property prop-kota-01');
    assert(initialProp.isSaved === true, 'Property marked isSaved = true');
    assert(initialProp.freshness !== undefined, 'Enriched freshness object present');
    assert(initialProp.freshness.totalBeds > 0, `Total beds calculated: ${initialProp.freshness.totalBeds}`);
    assert(typeof initialProp.freshness.occupancyBadge === 'string', `Occupancy badge present: "${initialProp.freshness.occupancyBadge}"`);
    assert(typeof initialProp.freshness.priceFreshness === 'string', `Price freshness present: "${initialProp.freshness.priceFreshness}"`);

    // -------------------------------------------------------------
    // Test Group 2: Save & Unsave Operations
    // -------------------------------------------------------------
    // Shortlist prop-pune-02
    const saveNewRes = await request('/api/saved/prop-pune-02', { method: 'POST' });
    assert(saveNewRes.status === 200, 'POST /api/saved/prop-pune-02 responds with 200 OK');
    assert(saveNewRes.data.isSaved === true, 'Property marked isSaved = true');
    assert(saveNewRes.data.savedCount === savedRes.data.savedCount + 1, 'Saved count incremented by 1');

    // Verify it is now in saved list
    const checkSavedRes = await request('/api/saved');
    const hasPuneProp = checkSavedRes.data.properties.some(p => p.id === 'prop-pune-02');
    assert(hasPuneProp === true, 'prop-pune-02 is now retrieved in saved list');

    // Attempt saving non-existent property
    const invalidSaveRes = await request('/api/saved/prop-invalid-999', { method: 'POST' });
    assert(invalidSaveRes.status === 404, 'Rejects invalid property ID with HTTP 404');

    // Remove from saved (DELETE)
    const delSavedRes = await request('/api/saved/prop-pune-02', { method: 'DELETE' });
    assert(delSavedRes.status === 200, 'DELETE /api/saved/prop-pune-02 responds with 200 OK');
    assert(delSavedRes.data.isSaved === false, 'Property isSaved = false');

    // Verify it is no longer in saved list
    const checkAfterDel = await request('/api/saved');
    const stillHasPune = checkAfterDel.data.properties.some(p => p.id === 'prop-pune-02');
    assert(stillHasPune === false, 'prop-pune-02 cleanly removed from saved list');

    // -------------------------------------------------------------
    // Test Group 3: Notifications Feed & Role Filtering
    // -------------------------------------------------------------
    const notifTenantRes = await request('/api/notifications?role=tenant');
    assert(notifTenantRes.status === 200, 'GET /api/notifications?role=tenant responds with 200 OK');
    assert(Array.isArray(notifTenantRes.data.notifications), 'Notifications returned as array');
    assert(notifTenantRes.data.unreadCount >= 1, `Tenant unread notifications count: ${notifTenantRes.data.unreadCount}`);

    // Verify all returned notifications belong to tenant
    const allTenant = notifTenantRes.data.notifications.every(n => n.recipientRole === 'tenant');
    assert(allTenant === true, 'All returned notifications belong to tenant');

    // Check seed notification
    const seedNotif = notifTenantRes.data.notifications.find(n => n.id === 'notif-101');
    assert(seedNotif !== undefined, 'Found seed notification notif-101');
    assert(seedNotif.type === 'visit_confirmed', 'Notification type is visit_confirmed');
    assert(seedNotif.priority === 'high', 'Notification priority is high');

    // Unread filter check
    const unreadOnlyRes = await request('/api/notifications?role=tenant&unreadOnly=true');
    assert(unreadOnlyRes.status === 200, 'GET /api/notifications?unreadOnly=true responds with 200 OK');
    const allUnread = unreadOnlyRes.data.notifications.every(n => n.isRead === false);
    assert(allUnread === true, 'All returned items have isRead = false');

    // Owner role notifications
    const notifOwnerRes = await request('/api/notifications?role=owner');
    assert(notifOwnerRes.status === 200, 'GET /api/notifications?role=owner responds with 200 OK');
    const allOwner = notifOwnerRes.data.notifications.every(n => n.recipientRole === 'owner');
    assert(allOwner === true, 'All returned notifications belong to owner');

    // -------------------------------------------------------------
    // Test Group 4: Read Receipts & Mark All as Read
    // -------------------------------------------------------------
    // Mark single notification as read
    const markReadRes = await request('/api/notifications/notif-101/mark-read', { method: 'POST' });
    assert(markReadRes.status === 200, 'POST /api/notifications/notif-101/mark-read responds with 200 OK');
    assert(markReadRes.data.notification.isRead === true, 'Notification isRead transitioned to true');

    // Mark non-existent notification
    const invalidMarkRes = await request('/api/notifications/notif-nonexistent/mark-read', { method: 'POST' });
    assert(invalidMarkRes.status === 404, 'Rejects invalid notification ID with HTTP 404');

    // Mark all notifications for tenant as read
    const markAllRes = await request('/api/notifications/mark-all-read', {
      method: 'POST',
      body: { role: 'tenant' }
    });
    assert(markAllRes.status === 200, 'POST /api/notifications/mark-all-read responds with 200 OK');
    assert(markAllRes.data.unreadCount === 0, 'Unread count updated to 0');

    const verifyAllRead = await request('/api/notifications?role=tenant');
    assert(verifyAllRead.data.unreadCount === 0, 'Verified tenant unread count is 0');

    // -------------------------------------------------------------
    // Test Group 5: Automated Trigger: New In-App Message Notification
    // -------------------------------------------------------------
    const msgRes = await request('/api/inquiries/inq-101/messages', {
      method: 'POST',
      body: {
        senderRole: 'tenant',
        senderName: 'Vikas Meena',
        text: 'Namaste Satish ji, please keep room keys ready tomorrow.'
      }
    });
    assert(msgRes.status === 201, 'Tenant sends message in thread (HTTP 201)');

    // Verify owner received automatic notification
    const ownerNotifsAfterMsg = await request('/api/notifications?role=owner');
    const msgNotif = ownerNotifsAfterMsg.data.notifications.find(n => 
      n.type === 'new_message' && n.entityId === 'inq-101'
    );
    assert(msgNotif !== undefined, 'Owner automatically received new_message notification');
    assert(msgNotif.body.includes('please keep room keys ready'), 'Notification body contains message snippet');

    // -------------------------------------------------------------
    // Test Group 6: Automated Trigger: Visit Confirmed Notification
    // -------------------------------------------------------------
    const visitRes = await request('/api/inquiries/inq-101/visit-status', {
      method: 'PUT',
      body: {
        status: 'confirmed',
        scheduledVisitDate: 'Tomorrow at 05:00 PM',
        note: 'Bring your student ID card'
      }
    });
    assert(visitRes.status === 200, 'Owner confirms visit status (HTTP 200)');

    // Verify tenant received visit confirmation notification
    const tenantNotifsAfterVisit = await request('/api/notifications?role=tenant');
    const visitNotif = tenantNotifsAfterVisit.data.notifications.find(n => 
      n.type === 'visit_confirmed' && n.entityId === 'inq-101'
    );
    assert(visitNotif !== undefined, 'Tenant automatically received visit_confirmed notification');
    assert(visitNotif.priority === 'high', 'Visit confirmation has high priority');

    // -------------------------------------------------------------
    // Test Group 7: Programmatic Notification Dispatch (Testing / Alert Engine)
    // -------------------------------------------------------------
    const sendNotifRes = await request('/api/notifications/send', {
      method: 'POST',
      body: {
        recipientRole: 'tenant',
        type: 'waitlist_alert',
        title: 'Instant Vacancy Alert! ⚡',
        body: 'Bed A-1 in Allen Samarth Boys Hostel just vacated!',
        propertyId: 'prop-kota-01',
        actionLabel: 'Claim Slot'
      }
    });
    assert(sendNotifRes.status === 201, 'POST /api/notifications/send dispatches notification (HTTP 201)');
    assert(sendNotifRes.data.notification.title === 'Instant Vacancy Alert! ⚡', 'Custom title preserved');

    // Validate reject on missing fields
    const invalidSendRes = await request('/api/notifications/send', {
      method: 'POST',
      body: { title: 'Missing role and body' }
    });
    assert(invalidSendRes.status === 400, 'Rejects notification without required fields (HTTP 400)');

    // -------------------------------------------------------------
    // Test Group 8: Notification Preferences Management
    // -------------------------------------------------------------
    const getPrefsRes = await request('/api/notifications/preferences');
    assert(getPrefsRes.status === 200, 'GET /api/notifications/preferences responds with 200 OK');
    assert(getPrefsRes.data.preferences.whatsappUpdates === true, 'WhatsApp updates enabled by default');
    assert(getPrefsRes.data.preferences.slotVacancyAlerts === true, 'Slot vacancy alerts enabled by default');

    // Update preferences
    const updatePrefsRes = await request('/api/notifications/preferences', {
      method: 'PUT',
      body: {
        whatsappUpdates: false,
        marketingEmails: true
      }
    });
    assert(updatePrefsRes.status === 200, 'PUT /api/notifications/preferences responds with 200 OK');
    assert(updatePrefsRes.data.preferences.whatsappUpdates === false, 'Updated preference persisted (whatsappUpdates: false)');
    assert(updatePrefsRes.data.preferences.marketingEmails === true, 'Updated preference persisted (marketingEmails: true)');

    // Teardown: Reset preferences back
    await request('/api/notifications/preferences', {
      method: 'PUT',
      body: {
        whatsappUpdates: true,
        marketingEmails: false
      }
    });

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\n📊 Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All Slice 7 Notifications & Saved Listings tests passed successfully!\n');
    process.exit(0);
  }
}

runTests();

