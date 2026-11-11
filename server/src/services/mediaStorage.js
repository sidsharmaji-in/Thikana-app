/**
 * GharDekho Cloud Media Storage Pipeline
 * Supports Local Disk, AWS S3 Presigned URLs, and Cloudinary Signed Uploads
 * Production Slice P4
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MEDIA_SECRET = process.env.MEDIA_SIGNING_SECRET || 'ghardekho-media-secret-2026-key';
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

// Strict Allowlist for Listing and Profile Media
const ALLOWED_MIME_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/heic': ['.heic'],
  'image/heif': ['.heif']
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const DEFAULT_PRESIGN_TTL_SECONDS = 900; // 15 Minutes

// Ensure local uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

// In-Memory Media Store for Confirmed Uploads
const mediaStore = new Map();

/**
 * Generate HMAC-SHA256 Cryptographic Signature
 */
function createSignature(payload, secret = MEDIA_SECRET) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify Cryptographic Signature
 */
function verifySignature(payload, signature, secret = MEDIA_SECRET) {
  if (!signature || typeof signature !== 'string') return false;
  const expected = createSignature(payload, secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'));
  } catch (e) {
    return false;
  }
}

/**
 * Local Disk Storage Provider
 */
class LocalDiskProvider {
  constructor(baseUrl = 'http://localhost:4000') {
    this.name = 'local';
    this.baseUrl = baseUrl;
    this.uploadsDir = UPLOADS_DIR;
  }

  generatePresignedUpload({ fileKey, publicId, mimeType, sizeBytes, category, expiresAt }) {
    const payload = `${publicId}:${fileKey}:${mimeType}:${sizeBytes}:${category}:${expiresAt}`;
    const token = createSignature(payload);
    
    // Upload endpoint on local server
    const uploadUrl = `${this.baseUrl}/api/media/upload-local/${token}`;

    return {
      provider: 'local',
      uploadUrl,
      uploadMethod: 'PUT',
      token,
      fileKey,
      publicId,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      headers: {
        'Content-Type': mimeType,
        'X-Upload-Token': token,
        'X-File-Key': fileKey
      }
    };
  }

  getResponsiveUrls(fileKey, publicId) {
    const raw = `${this.baseUrl}/uploads/${fileKey}`;
    return {
      original: raw,
      thumbnail: `${raw}?w=120&h=120&fit=crop`,
      card: `${raw}?w=480&h=320&fit=crop`,
      gallery: `${raw}?w=1200&h=800&fit=contain&format=webp`,
      watermarked: `${raw}?w=1200&h=800&wm=ghardekho-verified`
    };
  }
}

/**
 * Cloudinary Storage Provider
 */
class CloudinaryProvider {
  constructor(options = {}) {
    this.name = 'cloudinary';
    this.cloudName = options.cloudName || process.env.CLOUDINARY_CLOUD_NAME || 'ghardekho-media';
    this.apiKey = options.apiKey || process.env.CLOUDINARY_API_KEY || 'mock-api-key';
    this.apiSecret = options.apiSecret || process.env.CLOUDINARY_API_SECRET || MEDIA_SECRET;
  }

  generatePresignedUpload({ fileKey, publicId, mimeType, sizeBytes, category, expiresAt }) {
    const folder = `ghardekho/${category || 'properties'}`;
    const timestamp = Math.floor(Date.now() / 1000);

    // Cloudinary signature formula: alphabetical params string hashed with api_secret
    const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
    const signature = crypto.createHash('sha1').update(paramsToSign + this.apiSecret).digest('hex');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

    return {
      provider: 'cloudinary',
      uploadUrl,
      uploadMethod: 'POST',
      fileKey,
      publicId,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      fields: {
        api_key: this.apiKey,
        timestamp,
        public_id: publicId,
        folder,
        signature
      }
    };
  }

  getResponsiveUrls(fileKey, publicId) {
    const cdnBase = `https://res.cloudinary.com/${this.cloudName}/image/upload`;
    return {
      original: `${cdnBase}/${publicId}`,
      thumbnail: `${cdnBase}/c_thumb,w_120,h_120,g_face,q_auto,f_auto/${publicId}.webp`,
      card: `${cdnBase}/c_fill,w_480,h_320,q_auto,f_auto/${publicId}.webp`,
      gallery: `${cdnBase}/c_limit,w_1200,h_800,q_auto,f_auto/${publicId}.webp`,
      watermarked: `${cdnBase}/l_ghardekho_verified_badge,g_south_east,x_10,y_10,w_150/c_limit,w_1200,h_800,q_auto,f_auto/${publicId}.webp`
    };
  }
}

/**
 * AWS S3 Storage Provider (SigV4 Direct Upload)
 */
class S3Provider {
  constructor(options = {}) {
    this.name = 's3';
    this.bucket = options.bucket || process.env.AWS_S3_BUCKET || 'ghardekho-media-bucket';
    this.region = options.region || process.env.AWS_REGION || 'ap-south-1'; // Mumbai
    this.accessKeyId = options.accessKeyId || process.env.AWS_ACCESS_KEY_ID || 'MOCK_AWS_KEY';
    this.secretAccessKey = options.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY || MEDIA_SECRET;
    this.cdnDomain = options.cdnDomain || process.env.AWS_CLOUDFRONT_DOMAIN || `https://${this.bucket}.s3.${this.region}.amazonaws.com`;
  }

  generatePresignedUpload({ fileKey, publicId, mimeType, sizeBytes, category, expiresAt }) {
    const dateStamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '').slice(0, 8);
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const credential = `${this.accessKeyId}/${dateStamp}/${this.region}/s3/aws4_request`;

    // AWS SigV4 mock presigned query signature
    const canonical = `PUT\n/${this.bucket}/${fileKey}\nX-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${credential}&X-Amz-Date=${amzDate}&X-Amz-Expires=900&X-Amz-SignedHeaders=content-type;host`;
    const signature = crypto.createHmac('sha256', this.secretAccessKey).update(canonical).digest('hex');

    const uploadUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileKey}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${encodeURIComponent(credential)}&X-Amz-Date=${amzDate}&X-Amz-Expires=900&X-Amz-SignedHeaders=content-type;host&X-Amz-Signature=${signature}`;

    return {
      provider: 's3',
      uploadUrl,
      uploadMethod: 'PUT',
      fileKey,
      publicId,
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      headers: {
        'Content-Type': mimeType,
        'x-amz-acl': 'public-read'
      }
    };
  }

  getResponsiveUrls(fileKey, publicId) {
    const base = `${this.cdnDomain}/${fileKey}`;
    return {
      original: base,
      thumbnail: `${base}?w=120&h=120&format=webp`,
      card: `${base}?w=480&h=320&format=webp`,
      gallery: `${base}?w=1200&h=800&format=webp`,
      watermarked: `${base}?w=1200&h=800&wm=ghardekho-verified`
    };
  }
}

/**
 * Media Storage Service
 */
class MediaStorageService {
  constructor(providerType = process.env.MEDIA_STORAGE_PROVIDER || 'local') {
    this.providers = {
      local: new LocalDiskProvider(),
      cloudinary: new CloudinaryProvider(),
      s3: new S3Provider()
    };
    this.activeProviderName = providerType;
  }

  getProvider(name) {
    const target = name || this.activeProviderName;
    return this.providers[target] || this.providers.local;
  }

  setProvider(name) {
    if (this.providers[name]) {
      this.activeProviderName = name;
    }
  }

  /**
   * Validate file parameters before granting presigned upload
   */
  validateUploadRequest({ fileName, mimeType, sizeBytes, category }) {
    if (!fileName || typeof fileName !== 'string') {
      return { valid: false, error: 'MISSING_FILE_NAME', message: 'fileName is required' };
    }

    if (!mimeType || !ALLOWED_MIME_TYPES[mimeType.toLowerCase()]) {
      return {
        valid: false,
        error: 'INVALID_MIME_TYPE',
        message: `MIME type '${mimeType}' is not allowed. Allowed types: ${Object.keys(ALLOWED_MIME_TYPES).join(', ')}`
      };
    }

    if (!sizeBytes || typeof sizeBytes !== 'number' || sizeBytes <= 0) {
      return { valid: false, error: 'INVALID_FILE_SIZE', message: 'sizeBytes must be a positive number' };
    }

    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      return {
        valid: false,
        error: 'FILE_SIZE_EXCEEDED',
        message: `File size exceeds the 10MB maximum limit (${sizeBytes} bytes requested)`
      };
    }

    const validCategories = ['property_photo', 'room_photo', 'kyc_document', 'avatar'];
    const safeCategory = validCategories.includes(category) ? category : 'property_photo';

    return { valid: true, category: safeCategory };
  }

  /**
   * Create Presigned Upload Instructions
   */
  createPresignedUpload({ fileName, mimeType, sizeBytes, category, providerName, userId }) {
    const validation = this.validateUploadRequest({ fileName, mimeType, sizeBytes, category });
    if (!validation.valid) {
      return { success: false, ...validation };
    }

    const safeCategory = validation.category;
    const ext = path.extname(fileName).toLowerCase() || ALLOWED_MIME_TYPES[mimeType.toLowerCase()][0];
    const uniqueId = crypto.randomUUID();
    const publicId = `ghardekho_${safeCategory}_${Date.now()}_${uniqueId.slice(0, 8)}`;
    const fileKey = `${safeCategory}/${publicId}${ext}`;
    const expiresAt = Math.floor(Date.now() / 1000) + DEFAULT_PRESIGN_TTL_SECONDS;

    // Cryptographic token proving server authorization for this exact file payload
    const payload = `${publicId}:${fileKey}:${mimeType.toLowerCase()}:${sizeBytes}:${safeCategory}:${expiresAt}`;
    const signature = createSignature(payload);

    const provider = this.getProvider(providerName);
    const presignData = provider.generatePresignedUpload({
      fileKey,
      publicId,
      mimeType: mimeType.toLowerCase(),
      sizeBytes,
      category: safeCategory,
      expiresAt
    });

    return {
      success: true,
      fileKey,
      publicId,
      category: safeCategory,
      mimeType: mimeType.toLowerCase(),
      sizeBytes,
      signature,
      expiresAt: presignData.expiresAt,
      uploadUrl: presignData.uploadUrl,
      uploadMethod: presignData.uploadMethod,
      headers: presignData.headers || {},
      fields: presignData.fields || {},
      token: presignData.token,
      provider: provider.name
    };
  }

  /**
   * Verify and Confirm Media Upload
   */
  confirmUpload({ fileKey, publicId, mimeType, sizeBytes, category, signature, expiresAt, userId }) {
    // 1. Check expiration
    const nowSec = Math.floor(Date.now() / 1000);
    const expSec = typeof expiresAt === 'number' ? expiresAt : Math.floor(new Date(expiresAt).getTime() / 1000);
    
    if (isNaN(expSec) || nowSec > expSec) {
      return { success: false, error: 'PRESIGN_EXPIRED', message: 'Upload authorization window has expired' };
    }

    // 2. Validate cryptographic signature
    const payload = `${publicId}:${fileKey}:${mimeType.toLowerCase()}:${sizeBytes}:${category}:${expSec}`;
    if (!verifySignature(payload, signature)) {
      return { success: false, error: 'INVALID_SIGNATURE', message: 'Media authorization signature is invalid or tampered' };
    }

    // 3. Generate responsive URLs with watermarking metadata
    const provider = this.getProvider();
    const urls = provider.getResponsiveUrls(fileKey, publicId);

    const mediaId = `media-${publicId.slice(-12)}`;
    const mediaRecord = {
      id: mediaId,
      fileKey,
      publicId,
      mimeType: mimeType.toLowerCase(),
      sizeBytes,
      category,
      provider: provider.name,
      urls,
      isVerified: true,
      watermarked: true,
      watermarkText: 'GharDekho Verified 🛡️',
      uploadedBy: userId || 'anonymous',
      createdAt: new Date().toISOString()
    };

    mediaStore.set(mediaId, mediaRecord);
    mediaStore.set(publicId, mediaRecord);

    return {
      success: true,
      media: mediaRecord
    };
  }

  /**
   * Get confirmed media record
   */
  getMedia(mediaId) {
    return mediaStore.get(mediaId) || null;
  }

  /**
   * Reset store (for testing)
   */
  _clearStore() {
    mediaStore.clear();
  }
}

const mediaStorageService = new MediaStorageService();

module.exports = {
  mediaStorageService,
  LocalDiskProvider,
  CloudinaryProvider,
  S3Provider,
  createSignature,
  verifySignature,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  UPLOADS_DIR
};
