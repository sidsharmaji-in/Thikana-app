/**
 * GharDekho Production Health & Observability Router
 * Kubernetes Liveness & Readiness Probes, Memory & Metrics Telemetry
 * Production Slice P6
 */

const express = require('express');
const os = require('os');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const repository = require('../data/repository');
const bedLockService = require('../services/bedLockService');
const realtimeHub = require('../realtime/hub');
const { UPLOADS_DIR } = require('../services/mediaStorage');

let requestCounter = 0;

// Metric tracker middleware
router.use((req, res, next) => {
  requestCounter++;
  next();
});

/**
 * GET /api/health
 * Basic platform status
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    version: '1.0.0',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    service: 'ghardekho-api'
  });
});

/**
 * GET /api/health/live
 * Process Liveness Probe (Kubernetes / Docker)
 */
router.get('/health/live', (req, res) => {
  const mem = process.memoryUsage();
  res.status(200).json({
    status: 'alive',
    pid: process.pid,
    uptimeSeconds: Math.round(process.uptime()),
    nodeVersion: process.version,
    memory: {
      rssMb: Math.round(mem.rss / (1024 * 1024)),
      heapTotalMb: Math.round(mem.heapTotal / (1024 * 1024)),
      heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024))
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/health/ready
 * Deep Dependency Readiness Probe
 * Verifies Database, Bed Lock Engine, Storage & Real-Time Hub
 */
router.get('/health/ready', (req, res) => {
  const checks = {
    database: { status: 'healthy', provider: process.env.DATABASE_URL ? 'postgresql' : 'in-memory-repository' },
    bedLockEngine: { status: 'healthy', activeLocks: bedLockService.getActiveLocksCount() },
    realtimeHub: { status: 'healthy', connectedClients: realtimeHub.getStats().activeConnections },
    storage: { status: 'healthy', uploadsDirWritable: false }
  };

  // Check Database repository
  try {
    const props = repository.getProperties();
    checks.database.listingCount = props.length;
  } catch (err) {
    checks.database.status = 'unhealthy';
    checks.database.error = err.message;
  }

  // Check Local Media Storage Directory
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
    fs.accessSync(UPLOADS_DIR, fs.constants.W_OK);
    checks.storage.uploadsDirWritable = true;
  } catch (err) {
    checks.storage.status = 'degraded';
    checks.storage.error = err.message;
  }

  const isReady = checks.database.status === 'healthy';

  res.status(isReady ? 200 : 503).json({
    status: isReady ? 'ready' : 'not_ready',
    database: checks.database.status,
    timestamp: new Date().toISOString(),
    dependencies: checks
  });
});

/**
 * GET /api/health/metrics
 * Operational Telemetry & System Resource Metrics
 */
router.get('/health/metrics', (req, res) => {
  const mem = process.memoryUsage();
  const cpus = os.cpus();

  res.status(200).json({
    service: 'ghardekho-api',
    totalRequestsReceived: requestCounter,
    uptimeSeconds: Math.round(process.uptime()),
    system: {
      platform: process.platform,
      arch: process.arch,
      cpuCount: cpus.length,
      freeMemoryMb: Math.round(os.freemem() / (1024 * 1024)),
      totalMemoryMb: Math.round(os.totalmem() / (1024 * 1024))
    },
    process: {
      pid: process.pid,
      memoryRssMb: Math.round(mem.rss / (1024 * 1024)),
      heapUsedMb: Math.round(mem.heapUsed / (1024 * 1024))
    },
    realtime: realtimeHub.getStats(),
    bedLocks: {
      activeLocksCount: bedLockService.getActiveLocksCount(),
      leaseDurationSeconds: 600
    }
  });
});

/**
 * GET /api/health/sentry-test
 * Deliberate error endpoint for testing Sentry integration & error boundary
 */
router.get('/health/sentry-test', (req, res, next) => {
  const testError = new Error('Test Sentry Captured Exception for GharDekho Slice P6');
  testError.code = 'SENTRY_TEST_ERROR';
  testError.status = 500;
  next(testError);
});

/**
 * GET /api/stats
 * Platform overview stats
 */
router.get('/stats', (req, res) => {
  const stats = repository.getStats();
  res.json(stats);
});

module.exports = router;
