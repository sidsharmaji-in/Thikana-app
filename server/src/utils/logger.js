/**
 * GharDekho Production Structured JSON Logger
 * Zero-dependency, Pino-compatible structured log format
 * Production Slice P6
 */

const os = require('os');

const LOG_LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const LEVEL_NAMES = {
  10: 'debug',
  20: 'info',
  30: 'warn',
  40: 'error'
};

const CURRENT_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL || 'info'] || LOG_LEVELS.info;
const HOSTNAME = os.hostname();
const PID = process.pid;

// In-memory buffer for test inspection
const logBuffer = [];
const MAX_BUFFER = 200;

class StructuredLogger {
  constructor(defaultContext = {}) {
    this.context = {
      service: 'ghardekho-api',
      hostname: HOSTNAME,
      pid: PID,
      ...defaultContext
    };
  }

  child(additionalContext = {}) {
    return new StructuredLogger({
      ...this.context,
      ...additionalContext
    });
  }

  log(levelName, msg, meta = {}) {
    const levelNum = LOG_LEVELS[levelName] || LOG_LEVELS.info;
    if (levelNum < CURRENT_LEVEL) return;

    let errorObj = null;
    if (meta instanceof Error) {
      errorObj = {
        message: meta.message,
        stack: meta.stack,
        code: meta.code || 'UNKNOWN'
      };
      meta = {};
    } else if (meta.err instanceof Error) {
      errorObj = {
        message: meta.err.message,
        stack: meta.err.stack,
        code: meta.err.code || 'UNKNOWN'
      };
      delete meta.err;
    }

    const entry = {
      timestamp: new Date().toISOString(),
      level: levelName,
      levelValue: levelNum,
      msg,
      ...this.context,
      ...meta,
      ...(errorObj ? { err: errorObj } : {})
    };

    // Store in internal buffer for test verification
    logBuffer.push(entry);
    if (logBuffer.length > MAX_BUFFER) logBuffer.shift();

    const formatted = JSON.stringify(entry);

    if (process.env.NODE_ENV !== 'test') {
      if (levelName === 'error') {
        console.error(formatted);
      } else if (levelName === 'warn') {
        console.warn(formatted);
      } else {
        console.log(formatted);
      }
    }

    return entry;
  }

  debug(msg, meta) { return this.log('debug', msg, meta); }
  info(msg, meta) { return this.log('info', msg, meta); }
  warn(msg, meta) { return this.log('warn', msg, meta); }
  error(msg, meta) { return this.log('error', msg, meta); }

  getBuffer() {
    return [...logBuffer];
  }

  clearBuffer() {
    logBuffer.length = 0;
  }
}

const logger = new StructuredLogger();

module.exports = {
  logger,
  StructuredLogger,
  LOG_LEVELS
};
