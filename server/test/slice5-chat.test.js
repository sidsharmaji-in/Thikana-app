// Slice 5: Inquiry & In-App Chat System Test
const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
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

async function runTests() {
  console.log('🧪 Starting Slice 5: Inquiry & In-App Chat System Tests...\n');
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
    // 1. Fetch inquiries list
    const res1 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/inquiries',
      method: 'GET'
    });
    assert(res1.status === 200, "GET /api/inquiries responds with 200 OK");
    assert(Array.isArray(res1.data.inquiries), "Inquiries returned as array");
    assert(res1.data.inquiries.length >= 1, `Found ${res1.data.inquiries.length} initial inquiry threads`);

    // 2. Verify inquiry structure
    const seedThread = res1.data.inquiries.find(i => i.id === 'inq-101');
    assert(Boolean(seedThread), "Found seed thread inq-101");
    assert(Boolean(seedThread.ownerName), `Owner name present: ${seedThread.ownerName}`);
    assert(Boolean(seedThread.tenantName), `Tenant name present: ${seedThread.tenantName}`);
    assert(Array.isArray(seedThread.messages) && seedThread.messages.length >= 4, 
      `Thread contains full chat conversation (${seedThread.messages.length} messages)`);

    // 3. Fetch single chat thread with reader = tenant (marks unread as read)
    const res2 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/inquiries/inq-101?reader=tenant',
      method: 'GET'
    });
    assert(res2.status === 200, "GET /api/inquiries/inq-101 responds with 200 OK");
    assert(res2.data.inquiry.unreadCountTenant === 0, "Reading thread as tenant resets unreadCountTenant to 0");
    const ownerMsg = res2.data.inquiry.messages.find(m => m.senderRole === 'owner');
    assert(ownerMsg && ownerMsg.isRead === true, "Owner messages marked as read after tenant opens thread");

    // 4. Create new inquiry / conversation thread
    const newInquiryPayload = {
      propertyId: "prop-kota-01",
      tenantName: "Divyansh Rathore",
      tenantPhone: "+91 97888 22110",
      message: "Sir, I saw the room photos. Is the desert cooler working properly? Can I visit today at 4:30 PM?",
      scheduledVisitDate: "Today at 4:30 PM"
    };

    const res3 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/inquiries',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, newInquiryPayload);

    assert(res3.status === 201, "POST /api/inquiries creates new thread with HTTP 201");
    assert(res3.data.success === true, "Response confirms thread creation");
    const newThreadId = res3.data.inquiry.id;
    assert(res3.data.inquiry.ownerName.includes('Ramesh'), `Attached property owner: ${res3.data.inquiry.ownerName}`);
    assert(res3.data.inquiry.unreadCountOwner >= 1, "Owner unread count incremented for incoming inquiry");
    assert(res3.data.inquiry.messages.length === 2, "Created initial tenant message + system visit proposal message");

    // 5. Send message from Tenant to Owner
    const msgTenant = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: `/api/inquiries/${newThreadId}/messages`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      senderRole: 'tenant',
      senderName: 'Divyansh Rathore',
      text: 'Also Sir, is mess facility included or separate?'
    });
    assert(msgTenant.status === 201, "Tenant can send message in thread (HTTP 201)");
    assert(msgTenant.data.message.text.includes('mess facility'), "Message text recorded accurately");
    assert(msgTenant.data.message.senderRole === 'tenant', "Sender role recorded as tenant");
    assert(msgTenant.data.inquiry.unreadCountOwner >= 2, "Owner unread counter incremented");

    // 6. Send reply from Owner to Tenant
    const msgOwner = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: `/api/inquiries/${newThreadId}/messages`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      senderRole: 'owner',
      senderName: 'Ramesh Sharma',
      text: 'Mess is right next door (50m walk). Hygienic thali ₹2800/month. Come at 4:30 PM, I will show you.'
    });
    assert(msgOwner.status === 201, "Owner can send reply in thread (HTTP 201)");
    assert(msgOwner.data.message.senderRole === 'owner', "Sender role recorded as owner");
    assert(msgOwner.data.inquiry.unreadCountTenant >= 1, "Tenant unread counter incremented for owner reply");

    // 7. Reject empty message
    const emptyMsgRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: `/api/inquiries/${newThreadId}/messages`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      senderRole: 'tenant',
      text: '   '
    });
    assert(emptyMsgRes.status === 400, "Rejects empty message with HTTP 400");

    // 8. Update visit status: Owner confirms room visit
    const confirmVisitRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: `/api/inquiries/${newThreadId}/visit-status`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, {
      status: 'confirmed',
      scheduledVisitDate: 'Today at 4:30 PM',
      note: 'Gate security informed to allow entry.'
    });
    assert(confirmVisitRes.status === 200, "Owner can confirm room visit schedule (HTTP 200)");
    assert(confirmVisitRes.data.inquiry.status === 'confirmed', "Inquiry status updated to confirmed");
    const lastMsg = confirmVisitRes.data.inquiry.messages[confirmVisitRes.data.inquiry.messages.length - 1];
    assert(lastMsg.senderRole === 'system', "Generated concierge system message in chat");
    assert(lastMsg.text.includes('Gate security informed'), "System message contains owner visit note");

    // 9. Reject invalid visit status
    const invalidStatusRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: `/api/inquiries/${newThreadId}/visit-status`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, {
      status: 'invalid_status_code'
    });
    assert(invalidStatusRes.status === 400, "Rejects invalid visit status with HTTP 400");

    // 10. Handle 404 for non-existent thread
    const notFoundRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/inquiries/inq-non-existent-999',
      method: 'GET'
    });
    assert(notFoundRes.status === 404, "Invalid thread ID returns HTTP 404");

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\n📊 Results: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
