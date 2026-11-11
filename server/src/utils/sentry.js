/**
 * GharDekho Sentry & Error Monitoring Pipeline
 * Production Slice P6
 */

const { logger } = require('./logger');

class SentryClient {
  constructor() {
    this.dsn = process.env.SENTRY_DSN || null;
    this.environment = process.env.NODE_ENV || 'development';
    this.release = process.env.RELEASE_VERSION || 'ghardekho@1.0.0';
    this.capturedEvents = [];
    this.breadcrumbs = [];
    this.isInitialized = Boolean(this.dsn);
  }

  init(dsn, options = {}) {
    if (dsn) {
      this.dsn = dsn;
      this.isInitialized = true;
    }
    if (options.environment) this.environment = options.environment;
    if (options.release) this.release = options.release;
    return this;
  }

  addBreadcrumb(breadcrumb = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      category: breadcrumb.category || 'default',
      message: breadcrumb.message || '',
      level: breadcrumb.level || 'info',
      data: breadcrumb.data || {}
    };
    this.breadcrumbs.push(entry);
    if (this.breadcrumbs.length > 50) this.breadcrumbs.shift();
    return entry;
  }

  captureException(error, context = {}) {
    const eventId = `sentry-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const event = {
      eventId,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      release: this.release,
      type: 'exception',
      error: {
        name: error.name || 'Error',
        message: error.message || String(error),
        stack: error.stack || null
      },
      tags: {
        requestId: context.requestId || context.req?.id || 'unknown',
        route: context.route || context.req?.path || 'unknown',
        method: context.method || context.req?.method || 'unknown',
        ...context.tags
      },
      extra: context.extra || {},
      breadcrumbs: [...this.breadcrumbs]
    };

    this.capturedEvents.push(event);
    if (this.capturedEvents.length > 100) this.capturedEvents.shift();

    logger.error(`[Sentry Capture] ${error.message}`, {
      eventId,
      requestId: event.tags.requestId,
      err: error
    });

    return eventId;
  }

  captureMessage(message, level = 'info', context = {}) {
    const eventId = `sentry-msg-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const event = {
      eventId,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      release: this.release,
      type: 'message',
      message,
      level,
      tags: {
        requestId: context.requestId || context.req?.id || 'unknown',
        ...context.tags
      },
      extra: context.extra || {}
    };

    this.capturedEvents.push(event);
    return eventId;
  }

  getCapturedEvents() {
    return [...this.capturedEvents];
  }

  clearEvents() {
    this.capturedEvents.length = 0;
    this.breadcrumbs.length = 0;
  }
}

const sentry = new SentryClient();

/**
 * Express Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  const requestId = req.id || req.requestId || 'unknown';

  // Capture in Sentry
  const eventId = sentry.captureException(err, { req, requestId });

  const statusCode = err.status || err.statusCode || 500;
  const isDev = process.env.NODE_ENV !== 'production';

  res.status(statusCode).json({
    success: false,
    error: err.code || 'INTERNAL_SERVER_ERROR',
    message: isDev ? err.message : 'An unexpected server error occurred',
    requestId,
    eventId
  });
}

module.exports = {
  sentry,
  SentryClient,
  errorHandler
};

