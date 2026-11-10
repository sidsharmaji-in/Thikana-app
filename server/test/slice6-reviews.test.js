// Slice 6: Reviews, Ratings & Owner Verification Test
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
  console.log('🧪 Starting Slice 6: Reviews, Ratings & Owner Verification Tests...\n');
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
    // 1. Fetch reviews for seed property
    const res1 = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/prop-kota-01/reviews',
      method: 'GET'
    });
    assert(res1.status === 200, "GET /api/properties/prop-kota-01/reviews responds with 200 OK");
    assert(Array.isArray(res1.data.reviews), "Reviews returned as array");
    assert(res1.data.totalReviews >= 2, `Found ${res1.data.totalReviews} initial reviews`);
    assert(res1.data.averageRating >= 4.0, `Calculated average rating: ${res1.data.averageRating}`);
    assert(res1.data.verifiedReviewsCount >= 2, `Verified resident reviews count: ${res1.data.verifiedReviewsCount}`);
    assert(res1.data.breakdown['5'] >= 1, "Rating distribution contains 5-star reviews");

    // 2. Check seed review structure (verified badge & owner response)
    const seedReview = res1.data.reviews.find(r => r.id === 'rev-201');
    assert(Boolean(seedReview), "Found seed review rev-201");
    assert(seedReview.isVerifiedTenant === true, "Seed review has verified tenant badge");
    assert(Boolean(seedReview.ownerResponse), "Seed review contains owner response");
    assert(seedReview.ownerResponse.ownerName.includes('Ramesh'), `Owner replier: ${seedReview.ownerResponse.ownerName}`);

    // 3. Validation: Reject invalid rating (< 1 or > 5)
    const badRatingRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/prop-kota-01/reviews',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      tenantName: 'Rohit K.',
      rating: 6, // Invalid
      comment: 'This rating is out of bounds.'
    });
    assert(badRatingRes.status === 400, "Rejects rating > 5 with HTTP 400");

    // 4. Validation: Reject missing tenant name
    const badNameRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/prop-kota-01/reviews',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      rating: 5,
      comment: 'Valid comment text here.'
    });
    assert(badNameRes.status === 400, "Rejects review without tenant name with HTTP 400");

    // 5. Validation: Reject comment under 10 chars
    const shortCommentRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/prop-kota-01/reviews',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      tenantName: 'Rohit K.',
      rating: 5,
      comment: 'Nice PG' // Under 10 chars
    });
    assert(shortCommentRes.status === 400, "Rejects comment < 10 characters with HTTP 400");

    // 6. Submit valid review matching an existing inquiry (Verified Tenant Test)
    const validReviewRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/prop-kota-01/reviews',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      tenantName: 'Vikas Meena', // Matches inq-101 tenant
      tenantPhone: '+91 88990 11223',
      rating: 5,
      title: 'Peaceful study environment, no electricity interruptions',
      comment: 'Stayed for 6 months while attending Allen Samarth. Excellent water supply and silent rooms.',
      stayDurationMonths: 6
    });

    assert(validReviewRes.status === 201, "Successfully posted verified review (HTTP 201)");
    assert(validReviewRes.data.review.isVerifiedTenant === true, 
      "Automatically awarded 'Verified Resident' badge from confirmed inquiry history");
    const newReviewId = validReviewRes.data.review.id;
    assert(validReviewRes.data.propertyRating > 0, `Updated property rating: ${validReviewRes.data.propertyRating}`);
    assert(validReviewRes.data.reviewsCount >= 3, `Updated review count: ${validReviewRes.data.reviewsCount}`);

    // 7. Owner responds to the new review
    const ownerReplyRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: `/api/reviews/${newReviewId}/owner-response`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      ownerName: 'Ramesh Sharma',
      responseText: 'Thank you Vikas! Best wishes for your upcoming test series.'
    });
    assert(ownerReplyRes.status === 200, "Owner successfully replies to review (HTTP 200)");
    assert(Boolean(ownerReplyRes.data.review.ownerResponse), "Review contains ownerResponse object");
    assert(ownerReplyRes.data.review.ownerResponse.text.includes('test series'), "Owner reply text verified");

    // 8. Reject empty owner response
    const emptyReplyRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: `/api/reviews/${newReviewId}/owner-response`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      responseText: '   '
    });
    assert(emptyReplyRes.status === 400, "Rejects empty owner response with HTTP 400");

    // 9. Upvote / Like review
    const likeRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: `/api/reviews/${newReviewId}/like`,
      method: 'POST'
    });
    assert(likeRes.status === 200, "Tenants can upvote review (HTTP 200)");
    assert(likeRes.data.likesCount === 1, "Likes count incremented to 1");

    // 10. Owner Aadhaar & Government ID KYC verification
    const kycRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/prop-kota-01/verify-owner',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      documentType: 'Aadhaar Card',
      documentNumberLast4: '4821'
    });
    assert(kycRes.status === 200, "Owner KYC verification succeeds (HTTP 200)");
    assert(kycRes.data.owner.isKycDone === true, "Owner isKycDone set to true");
    assert(kycRes.data.owner.verificationBadge.includes('Shield Verified'), 
      `Verification badge issued: ${kycRes.data.owner.verificationBadge}`);

    // 11. Reject invalid property ID
    const notFoundPropRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/properties/non-existent-prop/reviews',
      method: 'GET'
    });
    assert(notFoundPropRes.status === 404, "Invalid property ID returns HTTP 404");

    // 12. Reject invalid review ID for like
    const notFoundReviewRes = await makeRequest({
      hostname: 'localhost',
      port: 4000,
      path: '/api/reviews/non-existent-rev/like',
      method: 'POST'
    });
    assert(notFoundReviewRes.status === 404, "Invalid review ID returns HTTP 404");

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

