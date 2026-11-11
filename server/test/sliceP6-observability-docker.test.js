/**
 * Slice P6 Verification Tests
 * Observability, Correlation IDs, Health Probes, Sentry Error Pipeline, Multi-Stage Dockerfile & Compose
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { logger, StructuredLogger } = require('../src/utils/logger');
const { sentry } = require('../src/utils/sentry');

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

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      ...(body ? { 'Content-Type': 'application/json' } : {})
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
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runSliceP6Tests() {
  console.log('\n🧪 Starting Slice P6: Production Observability, Sentry & Docker Stack Tests...\n');

  try {
    // ----------------------------------------------------
    // Section 1: Correlation ID & Request Tracing Middleware
    // ----------------------------------------------------
    console.log('--- 1. Correlation ID & Request Tracing ---');

    const autoIdRes = await request({ path: '/api/health' });
    assert(autoIdRes.status === 200, 'GET /api/health responds with 200 OK');
    const assignedRequestId = autoIdRes.headers['x-request-id'];
    assert(typeof assignedRequestId === 'string' && assignedRequestId.length >= 16, 'Auto-generates unique X-Request-ID header');
    assert(Boolean(autoIdRes.headers['x-response-time']), 'Attaches X-Response-Time latency header');

    const customId = `client-trace-${Date.now()}`;
    const customIdRes = await request({
      path: '/api/health',
      headers: { 'X-Request-ID': customId }
    });
    assert(customIdRes.headers['x-request-id'] === customId, 'Preserves incoming client X-Request-ID correlation token');

    // ----------------------------------------------------
    // Section 2: Kubernetes Liveness Probe (/api/health/live)
    // ----------------------------------------------------
    console.log('\n--- 2. Kubernetes Liveness Probe ---');

    const liveRes = await request({ path: '/api/health/live' });
    assert(liveRes.status === 200, 'GET /api/health/live responds with 200 OK');
    assert(liveRes.body.status === 'alive', 'Liveness probe reports status: alive');
    assert(typeof liveRes.body.pid === 'number' && liveRes.body.pid > 0, 'Exposes valid process ID');
    assert(typeof liveRes.body.uptimeSeconds === 'number', 'Exposes process uptime seconds');
    assert(liveRes.body.nodeVersion.startsWith('v'), 'Reports Node.js runtime version');
    assert(typeof liveRes.body.memory.rssMb === 'number' && liveRes.body.memory.rssMb > 0, 'Reports process RSS memory in MB');
    assert(typeof liveRes.body.memory.heapUsedMb === 'number', 'Reports Heap Used memory in MB');

    // ----------------------------------------------------
    // Section 3: Deep Readiness Probe (/api/health/ready)
    // ----------------------------------------------------
    console.log('\n--- 3. Deep Readiness Probe & Dependency Verification ---');

    const readyRes = await request({ path: '/api/health/ready' });
    assert(readyRes.status === 200, 'GET /api/health/ready responds with 200 OK');
    assert(readyRes.body.status === 'ready', 'Readiness probe confirms status: ready');
    assert(readyRes.body.dependencies.database.status === 'healthy', 'Database repository confirms healthy status');
    assert(readyRes.body.dependencies.database.listingCount > 0, 'Database confirms loaded listing records');
    assert(readyRes.body.dependencies.bedLockEngine.status === 'healthy', 'Bed lock engine confirms healthy status');
    assert(typeof readyRes.body.dependencies.bedLockEngine.activeLocks === 'number', 'Bed lock engine tracks active locks');
    assert(readyRes.body.dependencies.realtimeHub.status === 'healthy', 'Realtime WebSocket hub confirms healthy status');
    assert(readyRes.body.dependencies.storage.uploadsDirWritable === true, 'Media uploads directory confirms writable permissions');

    // ----------------------------------------------------
    // Section 4: Operational Metrics & Telemetry (/api/health/metrics)
    // ----------------------------------------------------
    console.log('\n--- 4. Operational Metrics & Telemetry ---');

    const metricsRes = await request({ path: '/api/health/metrics' });
    assert(metricsRes.status === 200, 'GET /api/health/metrics responds with 200 OK');
    assert(metricsRes.body.service === 'ghardekho-api', 'Telemetry reports service name');
    assert(typeof metricsRes.body.totalRequestsReceived === 'number' && metricsRes.body.totalRequestsReceived >= 3, 'Tracks total HTTP requests received');
    assert(typeof metricsRes.body.system.cpuCount === 'number' && metricsRes.body.system.cpuCount > 0, 'Reports system CPU core count');
    assert(typeof metricsRes.body.system.freeMemoryMb === 'number', 'Reports system free memory in MB');
    assert(metricsRes.body.bedLocks.leaseDurationSeconds === 600, 'Reports 10-minute (600s) bed reservation lease window');

    // ----------------------------------------------------
    // Section 5: Structured JSON Logger
    // ----------------------------------------------------
    console.log('\n--- 5. Structured JSON Logger ---');

    logger.clearBuffer();
    const testLogEntry = logger.info('Tenant viewed Balaji PG listing', {
      propertyId: 'prop-kota-01',
      city: 'Kota',
      requestId: 'test-req-123'
    });

    assert(testLogEntry.level === 'info', 'Logs at info level');
    assert(testLogEntry.service === 'ghardekho-api', 'Attaches service name to log entry');
    assert(testLogEntry.requestId === 'test-req-123', 'Propagates requestId in log context');
    assert(Boolean(testLogEntry.timestamp), 'Attaches ISO timestamp to log entry');

    // Child logger
    const childLogger = logger.child({ module: 'bedLockService', slotId: 's4' });
    const childEntry = childLogger.warn('Bed lock lease nearing expiration', { remainingSec: 45 });
    assert(childEntry.level === 'warn', 'Child logger logs at warn level');
    assert(childEntry.module === 'bedLockService', 'Child logger preserves module context');
    assert(childEntry.slotId === 's4', 'Child logger preserves slotId context');

    // Error serialization
    const sampleError = new Error('Database pool connection timeout');
    sampleError.code = 'DB_TIMEOUT';
    const errEntry = logger.error('Database connection failed', { err: sampleError });
    assert(errEntry.err.message === 'Database pool connection timeout', 'Serializes error message');
    assert(errEntry.err.code === 'DB_TIMEOUT', 'Serializes error code');
    assert(Boolean(errEntry.err.stack), 'Serializes error stack trace');

    // ----------------------------------------------------
    // Section 6: Sentry Error Pipeline & Centralized Error Boundary
    // ----------------------------------------------------
    console.log('\n--- 6. Sentry Error Boundary & Capture Pipeline ---');

    // 1. Integration test: Express error boundary captures unhandled exception and formats response
    const errorEndpointRes = await request({
      path: '/api/health/sentry-test',
      headers: { 'X-Request-ID': 'sentry-trace-999' }
    });

    assert(errorEndpointRes.status === 500, 'Deliberate test error returns HTTP 500 Internal Server Error');
    assert(errorEndpointRes.body.success === false, 'Error response reports success: false');
    assert(errorEndpointRes.body.error === 'SENTRY_TEST_ERROR', 'Error response reports error code');
    assert(errorEndpointRes.body.requestId === 'sentry-trace-999', 'Error response preserves X-Request-ID');
    assert(Boolean(errorEndpointRes.body.eventId) && errorEndpointRes.body.eventId.startsWith('sentry-'), 'Error response includes generated Sentry eventId');

    // 2. Unit test: Sentry client breadcrumb aggregation, tag propagation, and error serialization
    sentry.clearEvents();
    sentry.addBreadcrumb({
      category: 'navigation',
      message: 'User opened property detail sheet',
      data: { propertyId: 'prop-kota-01' }
    });

    const testAppErr = new Error('Database pool connection dropped');
    const localEventId = sentry.captureException(testAppErr, {
      requestId: 'sentry-trace-999',
      route: '/api/properties/prop-kota-01',
      method: 'GET'
    });

    assert(Boolean(localEventId), 'Sentry client generates unique localEventId');
    const sentryEvents = sentry.getCapturedEvents();
    assert(sentryEvents.length === 1, 'Sentry client captured the exception');
    const latestEvent = sentryEvents[0];
    assert(latestEvent.tags.requestId === 'sentry-trace-999', 'Sentry event carries correlation requestId tag');
    assert(latestEvent.error.message.includes('Database pool connection dropped'), 'Sentry event records error message');
    assert(latestEvent.breadcrumbs.some(b => b.category === 'navigation'), 'Sentry event attaches prior breadcrumbs');

    // ----------------------------------------------------
    // Section 7: Production Multi-Stage Dockerfile Verification
    // ----------------------------------------------------
    console.log('\n--- 7. Production Multi-Stage Dockerfile ---');

    const dockerfilePath = path.resolve(__dirname, '../../Dockerfile');
    assert(fs.existsSync(dockerfilePath), 'Dockerfile exists at repository root');
    const dockerfileContent = fs.readFileSync(dockerfilePath, 'utf-8');

    assert(dockerfileContent.includes('FROM node:20-alpine AS builder'), 'Dockerfile defines builder stage (node:20-alpine AS builder)');
    assert(dockerfileContent.includes('FROM node:20-alpine AS runner'), 'Dockerfile defines minimal runner stage (node:20-alpine AS runner)');
    assert(dockerfileContent.includes('USER node'), 'Dockerfile enforces unprivileged non-root user (USER node)');
    assert(dockerfileContent.includes('HEALTHCHECK'), 'Dockerfile defines container HEALTHCHECK instruction');
    assert(dockerfileContent.includes('/api/health/live'), 'Dockerfile healthcheck probes /api/health/live endpoint');
    assert(dockerfileContent.includes('EXPOSE 4000'), 'Dockerfile exposes port 4000');

    // ----------------------------------------------------
    // Section 8: Production Docker Compose Specification
    // ----------------------------------------------------
    console.log('\n--- 8. Production Docker Compose Architecture ---');

    const composePath = path.resolve(__dirname, '../../docker-compose.yml');
    assert(fs.existsSync(composePath), 'docker-compose.yml exists at repository root');
    const composeContent = fs.readFileSync(composePath, 'utf-8');

    assert(composeContent.includes('ghardekho-app:'), 'Compose defines ghardekho-app container service');
    assert(composeContent.includes('ghardekho-db:'), 'Compose defines ghardekho-db container service');
    assert(composeContent.includes('postgis/postgis:16-3.4-alpine'), 'Compose configures PostGIS 16 database image');
    assert(composeContent.includes('ghardekho-redis:'), 'Compose defines ghardekho-redis container service');
    assert(composeContent.includes('redis:7-alpine'), 'Compose configures Redis 7 Alpine image');
    assert(composeContent.includes('condition: service_healthy'), 'App depends on db & redis with service_healthy condition');
    assert(composeContent.includes('pgdata:'), 'Compose configures persistent pgdata volume');
    assert(composeContent.includes('redisdata:'), 'Compose configures persistent redisdata volume');
    assert(composeContent.includes('media_uploads:'), 'Compose configures persistent media_uploads volume');
    assert(composeContent.includes('ghardekho-network:'), 'Compose isolates stack on dedicated bridge network');

    console.log(`\n📊 Results: ${passedTests} Passed, ${failedTests} Failed`);
    if (failedTests > 0) {
      console.error('❌ Some Slice P6 tests failed.');
      process.exit(1);
    } else {
      console.log('🏛️ All Slice P6 Production Observability & Docker Stack tests passed successfully!\n');
    }
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
}

runSliceP6Tests();
