/**
 * Slice P4 Verification Tests
 * Cloud Media Direct Upload Pipeline, MIME Security, Cryptographic Signatures & Responsive CDN Delivery
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const {
  mediaStorageService,
  LocalDiskProvider,
  CloudinaryProvider,
  S3Provider,
  createSignature,
  verifySignature,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  UPLOADS_DIR
} = require('../src/services/mediaStorage');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${details ? `(${details})` : ''}`);
    failedTests++;
  }
}

function request(options, body = null, isBinary = false) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      ...(!isBinary && body ? { 'Content-Type': 'application/json' } : {})
    };

    const req = http.request({
      hostname: 'localhost',
      port: 4000,
      path: options.path,
      method: options.method || 'GET',
      headers: { ...defaultHeaders, ...options.headers }
    }, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf-8');
        let data = null;
        try {
          data = JSON.parse(raw);
        } catch (e) {
          data = raw;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', reject);

    if (body) {
      if (isBinary) {
        req.write(body);
      } else {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
    }
    req.end();
  });
}

async function runSliceP4Tests() {
  console.log('\n🧪 Starting Slice P4: Direct Cloud Media Upload & CDN Pipeline Tests...\n');

  try {
    // ----------------------------------------------------
    // Section 1: MIME Type Validation & Security Allowlist
    // ----------------------------------------------------
    console.log('--- 1. MIME Validation & Allowlist Security ---');

    const validPhotoRes = await request({
      path: '/api/media/presign',
      method: 'POST'
    }, {
      fileName: 'room_balcony.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 2400000,
      category: 'property_photo'
    });
    assert(validPhotoRes.status === 200, 'Accepts valid image/jpeg');
    assert(validPhotoRes.body.success === true, 'Returns success: true for JPEG');
    assert(validPhotoRes.body.fileKey.endsWith('.jpg'), 'Generates matching .jpg file extension');

    const validPngRes = await request({
      path: '/api/media/presign',
      method: 'POST'
    }, {
      fileName: 'floor_plan.png',
      mimeType: 'image/png',
      sizeBytes: 1500000,
      category: 'room_photo'
    });
    assert(validPngRes.status === 200, 'Accepts valid image/png');
    assert(validPngRes.body.mimeType === 'image/png', 'Preserves PNG MIME type');

    const validWebpRes = await request({
      path: '/api/media/presign',
      method: 'POST'
    }, {
      fileName: 'washroom.webp',
      mimeType: 'image/webp',
      sizeBytes: 850000,
      category: 'property_photo'
    });
    assert(validWebpRes.status === 200, 'Accepts valid modern image/webp');

    const validHeicRes = await request({
      path: '/api/media/presign',
      method: 'POST'
    }, {
      fileName: 'iphone_shot.heic',
      mimeType: 'image/heic',
      sizeBytes: 3200000,
      category: 'property_photo'
    });
    assert(validHeicRes.status === 200, 'Accepts iOS camera image/heic');

    // Rejection of dangerous or non-image MIME types
    const exeRes = await request({
      path: '/api/media/presign',
      method: 'POST'
    }, {
      fileName: 'malware.exe',
      mimeType: 'application/x-msdownload',
      sizeBytes: 1048576,
      category: 'property_photo'
    });
    assert(exeRes.status === 400, 'Rejects executable binary (HTTP 400)');
    assert(exeRes.body.error === 'INVALID_MIME_TYPE', 'Reports INVALID_MIME_TYPE error');

    const htmlRes = await request({
      path: '/api/media/presign',
      method: 'POST'
    }, {
      fileName: 'xss.html',
      mimeType: 'text/html',
      sizeBytes: 5000,
      category: 'avatar'
    });
    assert(htmlRes.status === 400, 'Rejects HTML file upload attempt (HTTP 400)');

    const svgRes = await request({
      path: '/api/media/presign',
      method: 'POST'
    }, {
      fileName: 'vector_script.svg',
      mimeType: 'image/svg+xml',
      sizeBytes: 12000,
      category: 'avatar'
    });
    assert(svgRes.status === 400, 'Disarms SVG upload to prevent stored script injection (HTTP 400)');

    // ----------------------------------------------------
    // Section 2: File Size Bounds & Constraint Enforcement
    // ----------------------------------------------------
    console.log('\n--- 2. File Size Constraint Enforcement ---');

    const zeroByteRes = await request({
      path: '/api/media/presign',
      method: 'POST'
    }, {
      fileName: 'empty.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 0,
      category: 'property_photo'
    });
    assert(zeroByteRes.status === 400, 'Rejects empty 0-byte file (HTTP 400)');
    assert(zeroByteRes.body.error === 'INVALID_FILE_SIZE', 'Reports INVALID_FILE_SIZE');

    const oversizedRes = await request({
      path: '/api/media/presign',
      method: 'POST'
    }, {
      fileName: 'massive_raw_dslr.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 25 * 1024 * 1024, // 25MB > 10MB limit
      category: 'property_photo'
    });
    assert(oversizedRes.status === 400, 'Rejects file exceeding 10MB limit (HTTP 400)');
    assert(oversizedRes.body.error === 'FILE_SIZE_EXCEEDED', 'Reports FILE_SIZE_EXCEEDED error code');

    // ----------------------------------------------------
    // Section 3: Presigned Upload Generation & Crypto Signatures
    // ----------------------------------------------------
    console.log('\n--- 3. Presigned Credentials & Cryptographic Signatures ---');

    const presign = await request({
      path: '/api/media/presign',
      method: 'POST'
    }, {
      fileName: 'bedroom_twin.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 1800000,
      category: 'room_photo'
    });

    assert(presign.status === 200, 'POST /api/media/presign responds with 200 OK');
    assert(typeof presign.body.publicId === 'string' && presign.body.publicId.length > 10, 'Generates secure publicId');
    assert(typeof presign.body.fileKey === 'string' && presign.body.fileKey.startsWith('room_photo/'), 'Namespaced fileKey in category subfolder');
    assert(typeof presign.body.signature === 'string' && presign.body.signature.length === 64, 'Issues 64-char HMAC-SHA256 authorization signature');
    assert(typeof presign.body.uploadUrl === 'string' && presign.body.uploadUrl.includes('/api/media/upload-local/'), 'Provides direct upload URL');
    assert(Boolean(presign.body.expiresAt), 'Attaches ISO expiration timestamp');

    // ----------------------------------------------------
    // Section 4: Provider Pluggability (Cloudinary & AWS S3)
    // ----------------------------------------------------
    console.log('\n--- 4. Provider Pluggability (Cloudinary & S3) ---');

    const cloudProvider = new CloudinaryProvider({ cloudName: 'ghardekho-prod', apiKey: 'cloudinary-key-123' });
    const cloudPresign = cloudProvider.generatePresignedUpload({
      fileKey: 'properties/room1.jpg',
      publicId: 'ghardekho_prop_101',
      mimeType: 'image/jpeg',
      sizeBytes: 1500000,
      category: 'properties',
      expiresAt: Math.floor(Date.now() / 1000) + 900
    });
    assert(cloudPresign.provider === 'cloudinary', 'CloudinaryProvider identifies provider = cloudinary');
    assert(cloudPresign.uploadUrl === 'https://api.cloudinary.com/v1_1/ghardekho-prod/image/upload', 'Direct Cloudinary API upload URL');
    assert(Boolean(cloudPresign.fields.signature), 'Computes Cloudinary SHA1 authentication signature');
    assert(cloudPresign.fields.folder === 'ghardekho/properties', 'Cloudinary target folder is configured');

    const cloudUrls = cloudProvider.getResponsiveUrls('properties/room1.jpg', 'ghardekho_prop_101');
    assert(cloudUrls.thumbnail.includes('w_120,h_120'), 'Cloudinary generates 120px micro thumbnail URL');
    assert(cloudUrls.card.includes('w_480,h_320'), 'Cloudinary generates 480px card thumbnail URL');
    assert(cloudUrls.gallery.includes('w_1200,h_800'), 'Cloudinary generates 1200px full gallery URL');
    assert(cloudUrls.watermarked.includes('l_ghardekho_verified_badge'), 'Cloudinary attaches trust watermark layer');

    const s3Provider = new S3Provider({ bucket: 'ghardekho-uploads', region: 'ap-south-1' });
    const s3Presign = s3Provider.generatePresignedUpload({
      fileKey: 'properties/prop99.webp',
      publicId: 'ghardekho_s3_99',
      mimeType: 'image/webp',
      sizeBytes: 900000,
      category: 'properties',
      expiresAt: Math.floor(Date.now() / 1000) + 900
    });
    assert(s3Presign.provider === 's3', 'S3Provider identifies provider = s3');
    assert(s3Presign.uploadUrl.includes('X-Amz-Signature='), 'Generates AWS SigV4 presigned upload URL with signature');
    assert(s3Presign.uploadUrl.includes('ap-south-1'), 'Routes to Mumbai (ap-south-1) S3 region');

    // ----------------------------------------------------
    // Section 5: Direct Binary Stream Upload (Local Provider)
    // ----------------------------------------------------
    console.log('\n--- 5. Direct Binary Stream Upload to Local Storage ---');

    const testFilePayload = Buffer.from('MOCK_JPEG_BINARY_DATA_' + Date.now());
    const uploadRes = await request({
      path: `/api/media/upload-local/${presign.body.token}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
        'X-File-Key': presign.body.fileKey
      }
    }, testFilePayload, true);

    assert(uploadRes.status === 200, 'PUT /api/media/upload-local responds with 200 OK');
    assert(uploadRes.body.success === true, 'Upload stream confirmed success: true');
    assert(uploadRes.body.bytesWritten === testFilePayload.length, 'Streamed exact byte length to disk');

    const localSavedPath = path.join(UPLOADS_DIR, presign.body.fileKey);
    assert(fs.existsSync(localSavedPath), 'Uploaded file physically exists on server disk');
    const diskContent = fs.readFileSync(localSavedPath);
    assert(diskContent.equals(testFilePayload), 'On-disk file content matches uploaded binary');

    // ----------------------------------------------------
    // Section 6: Upload Confirmation & Responsive CDN URLs
    // ----------------------------------------------------
    console.log('\n--- 6. Upload Confirmation & Responsive Formats ---');

    const confirmRes = await request({
      path: '/api/media/confirm',
      method: 'POST'
    }, {
      fileKey: presign.body.fileKey,
      publicId: presign.body.publicId,
      mimeType: presign.body.mimeType,
      sizeBytes: presign.body.sizeBytes,
      category: presign.body.category,
      signature: presign.body.signature,
      expiresAt: presign.body.expiresAt
    });

    assert(confirmRes.status === 200, 'POST /api/media/confirm responds with 200 OK');
    assert(confirmRes.body.success === true, 'Confirmation marks upload success: true');
    assert(confirmRes.body.media.isVerified === true, 'Media record marked isVerified: true');
    assert(confirmRes.body.media.watermarked === true, 'Media attaches trust watermark flag');
    assert(confirmRes.body.media.watermarkText === 'GharDekho Verified 🛡️', 'Confirms GharDekho trust watermark text');
    assert(Boolean(confirmRes.body.media.urls.thumbnail), 'Generates 120px micro-thumbnail URL');
    assert(Boolean(confirmRes.body.media.urls.card), 'Generates 480px card thumbnail URL');
    assert(Boolean(confirmRes.body.media.urls.gallery), 'Generates 1200px full view URL');

    const mediaId = confirmRes.body.media.id;

    // ----------------------------------------------------
    // Section 7: Media Metadata Retrieval
    // ----------------------------------------------------
    console.log('\n--- 7. Media Metadata Retrieval ---');

    const getRes = await request({
      path: `/api/media/${mediaId}`,
      method: 'GET'
    });
    assert(getRes.status === 200, 'GET /api/media/:id responds with 200 OK');
    assert(getRes.body.media.id === mediaId, 'Retrieved media matches confirmed ID');
    assert(getRes.body.media.fileKey === presign.body.fileKey, 'Retrieved media has correct fileKey');

    const notFoundRes = await request({
      path: '/api/media/media-non-existent-999',
      method: 'GET'
    });
    assert(notFoundRes.status === 404, 'Non-existent media returns HTTP 404 Not Found');

    // ----------------------------------------------------
    // Section 8: Security, Tampering & Expiration Guards
    // ----------------------------------------------------
    console.log('\n--- 8. Security & Cryptographic Tamper Defense ---');

    // Tampered signature attempt
    const tamperedRes = await request({
      path: '/api/media/confirm',
      method: 'POST'
    }, {
      fileKey: presign.body.fileKey,
      publicId: presign.body.publicId,
      mimeType: presign.body.mimeType,
      sizeBytes: presign.body.sizeBytes,
      category: presign.body.category,
      signature: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      expiresAt: presign.body.expiresAt
    });
    assert(tamperedRes.status === 401, 'Rejects forged signature with HTTP 401 Unauthorized');
    assert(tamperedRes.body.error === 'INVALID_SIGNATURE', 'Reports INVALID_SIGNATURE');

    // Tampered payload attempt (changed file size)
    const tamperedPayloadRes = await request({
      path: '/api/media/confirm',
      method: 'POST'
    }, {
      fileKey: presign.body.fileKey,
      publicId: presign.body.publicId,
      mimeType: presign.body.mimeType,
      sizeBytes: 9999999, // tampered size
      category: presign.body.category,
      signature: presign.body.signature,
      expiresAt: presign.body.expiresAt
    });
    assert(tamperedPayloadRes.status === 401, 'Detects tampered file size parameter (HTTP 401)');

    // Expired presign attempt
    const expiredRes = await request({
      path: '/api/media/confirm',
      method: 'POST'
    }, {
      fileKey: presign.body.fileKey,
      publicId: presign.body.publicId,
      mimeType: presign.body.mimeType,
      sizeBytes: presign.body.sizeBytes,
      category: presign.body.category,
      signature: presign.body.signature,
      expiresAt: new Date(Date.now() - 60000).toISOString() // 1 minute in the past
    });
    assert(expiredRes.status === 410, 'Rejects expired presign authorization with HTTP 410 Gone');
    assert(expiredRes.body.error === 'PRESIGN_EXPIRED', 'Reports PRESIGN_EXPIRED');

    // ----------------------------------------------------
    // Section 9: Batch Presign for Multi-Photo Wizard
    // ----------------------------------------------------
    console.log('\n--- 9. Batch Presign for Multi-Photo Listing Wizard ---');

    const batchRes = await request({
      path: '/api/media/batch-presign',
      method: 'POST'
    }, {
      files: [
        { fileName: 'photo_living_room.jpg', mimeType: 'image/jpeg', sizeBytes: 1800000 },
        { fileName: 'photo_balcony_view.jpg', mimeType: 'image/jpeg', sizeBytes: 2100000 },
        { fileName: 'photo_attached_bath.jpg', mimeType: 'image/jpeg', sizeBytes: 1400000 },
        { fileName: 'photo_study_desk.jpg', mimeType: 'image/jpeg', sizeBytes: 1650000 },
        { fileName: 'photo_building_gate.jpg', mimeType: 'image/jpeg', sizeBytes: 1950000 }
      ],
      category: 'property_photo'
    });

    assert(batchRes.status === 200, 'POST /api/media/batch-presign responds with 200 OK');
    assert(batchRes.body.success === true, 'Batch request succeeds');
    assert(batchRes.body.count === 5, 'Generates credentials for all 5 listing photos');
    assert(batchRes.body.items.every(item => item.signature && item.uploadUrl), 'All 5 items contain valid signature and uploadUrl');

    const emptyBatchRes = await request({
      path: '/api/media/batch-presign',
      method: 'POST'
    }, { files: [] });
    assert(emptyBatchRes.status === 400, 'Rejects empty batch array with HTTP 400');

    // ----------------------------------------------------
    // Section 10: Provider Status & Discovery
    // ----------------------------------------------------
    console.log('\n--- 10. Provider Status & Configuration Discovery ---');

    const providerRes = await request({
      path: '/api/media/providers',
      method: 'GET'
    });
    assert(providerRes.status === 200, 'GET /api/media/providers responds with 200 OK');
    assert(providerRes.body.supportedProviders.includes('cloudinary'), 'Lists Cloudinary provider support');
    assert(providerRes.body.supportedProviders.includes('s3'), 'Lists S3 provider support');
    assert(providerRes.body.supportedProviders.includes('local'), 'Lists Local disk provider support');
    assert(providerRes.body.maxSizeBytes === 10485760, 'Advertises 10MB maximum file size limit');

    console.log(`\n📊 Results: ${passedTests} Passed, ${failedTests} Failed`);
    if (failedTests > 0) {
      console.error('❌ Some Slice P4 tests failed.');
      process.exit(1);
    } else {
      console.log('📸 All Slice P4 Cloud Media Pipeline tests passed successfully!\n');
    }
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
}

runSliceP4Tests();
