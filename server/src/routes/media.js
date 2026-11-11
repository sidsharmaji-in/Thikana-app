/**
 * GharDekho Cloud Media API Router
 * Presigned Uploads, Local Mock Storage, Verification, and Responsive Image Delivery
 * Production Slice P4
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const {
  mediaStorageService,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  UPLOADS_DIR
} = require('../services/mediaStorage');

const router = express.Router();

/**
 * POST /api/media/presign
 * Generates secure, time-limited presigned upload credentials
 */
router.post('/presign', (req, res) => {
  const { fileName, mimeType, sizeBytes, category, provider } = req.body || {};
  const userId = req.headers['x-user-id'] || 'user-anon';

  const result = mediaStorageService.createPresignedUpload({
    fileName,
    mimeType,
    sizeBytes,
    category,
    providerName: provider,
    userId
  });

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.status(200).json(result);
});

/**
 * POST /api/media/batch-presign
 * Generates presigned upload instructions for multiple files (e.g. 5–20 listing photos)
 */
router.post('/batch-presign', (req, res) => {
  const { files, category, provider } = req.body || {};
  const userId = req.headers['x-user-id'] || 'user-anon';

  if (!Array.isArray(files) || files.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_BATCH',
      message: 'files must be a non-empty array'
    });
  }

  if (files.length > 20) {
    return res.status(400).json({
      success: false,
      error: 'BATCH_SIZE_EXCEEDED',
      message: 'Maximum 20 files can be presigned in a single batch'
    });
  }

  const results = [];
  for (const file of files) {
    const item = mediaStorageService.createPresignedUpload({
      fileName: file.fileName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      category: category || file.category,
      providerName: provider,
      userId
    });
    results.push(item);
  }

  const allSuccessful = results.every(r => r.success);

  res.status(allSuccessful ? 200 : 207).json({
    success: allSuccessful,
    count: results.length,
    items: results
  });
});

/**
 * PUT /api/media/upload-local/:token
 * Direct stream receiver for local disk provider
 */
router.put('/upload-local/:token', (req, res) => {
  const { token } = req.params;
  const fileKey = req.headers['x-file-key'];
  const contentType = req.headers['content-type'];

  if (!fileKey || typeof fileKey !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'MISSING_FILE_KEY',
      message: 'X-File-Key header is required for local uploads'
    });
  }

  // Prevent path traversal
  const safeFileKey = path.normalize(fileKey).replace(/^(\.\.[\/\\])+/, '');
  const targetPath = path.join(UPLOADS_DIR, safeFileKey);
  const targetDir = path.dirname(targetPath);

  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const writeStream = fs.createWriteStream(targetPath);
    let bytesWritten = 0;

    req.on('data', chunk => {
      bytesWritten += chunk.length;
      if (bytesWritten > MAX_FILE_SIZE_BYTES) {
        writeStream.destroy();
        try { fs.unlinkSync(targetPath); } catch (e) {}
        return res.status(413).json({
          success: false,
          error: 'PAYLOAD_TOO_LARGE',
          message: 'Uploaded file exceeds 10MB limit'
        });
      }
    });

    req.pipe(writeStream);

    writeStream.on('finish', () => {
      res.status(200).json({
        success: true,
        message: 'File successfully stored on local disk',
        fileKey: safeFileKey,
        bytesWritten,
        contentType
      });
    });

    writeStream.on('error', err => {
      res.status(500).json({
        success: false,
        error: 'STORAGE_WRITE_ERROR',
        message: err.message
      });
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'STORAGE_INIT_ERROR',
      message: err.message
    });
  }
});

/**
 * POST /api/media/confirm
 * Confirms uploaded media, verifies signature, and issues responsive image URLs
 */
router.post('/confirm', (req, res) => {
  const { fileKey, publicId, mimeType, sizeBytes, category, signature, expiresAt } = req.body || {};
  const userId = req.headers['x-user-id'] || 'user-anon';

  if (!fileKey || !publicId || !signature || !mimeType || !sizeBytes) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_CONFIRMATION_FIELDS',
      message: 'fileKey, publicId, mimeType, sizeBytes, and signature are required'
    });
  }

  const result = mediaStorageService.confirmUpload({
    fileKey,
    publicId,
    mimeType,
    sizeBytes,
    category,
    signature,
    expiresAt,
    userId
  });

  if (!result.success) {
    const statusCode = result.error === 'PRESIGN_EXPIRED' ? 410 : 401;
    return res.status(statusCode).json(result);
  }

  res.status(200).json(result);
});

/**
 * GET /api/media/providers
 * Returns storage provider status
 */
router.get('/providers', (req, res) => {
  res.status(200).json({
    success: true,
    activeProvider: mediaStorageService.activeProviderName,
    supportedProviders: ['local', 'cloudinary', 's3'],
    maxSizeBytes: MAX_FILE_SIZE_BYTES,
    allowedMimeTypes: Object.keys(ALLOWED_MIME_TYPES)
  });
});

/**
 * GET /api/media/:mediaId
 * Retrieves confirmed media metadata and responsive URLs
 */
router.get('/:mediaId', (req, res) => {
  const { mediaId } = req.params;
  const media = mediaStorageService.getMedia(mediaId);

  if (!media) {
    return res.status(404).json({
      success: false,
      error: 'MEDIA_NOT_FOUND',
      message: `No media found with id '${mediaId}'`
    });
  }

  res.status(200).json({
    success: true,
    media
  });
});

module.exports = router;

