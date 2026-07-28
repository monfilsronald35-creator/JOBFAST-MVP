/**
 * Core Logger — structured logging with context propagation
 * JSON in production, colored in dev, silent in test
 */
import { env } from '../config/env.js';

const isDev  = env.APP_STAGE !== 'production';
const isTest = env.APP_STAGE === 'test';

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = isDev ? LEVELS.debug : LEVELS.info;

const COLORS = { debug: '\x1b[36m', info: '\x1b[32m', warn: '\x1b[33m', error: '\x1b[31m', reset: '\x1b[0m' };

function format(level, message, meta = {}) {
  const ts = new Date().toISOString();
  if (!isDev) {
    return JSON.stringify({ ts, level, message, ...meta });
  }
  const color = COLORS[level] || '';
  const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
  return `${color}[${level.toUpperCase()}]${COLORS.reset} ${ts} ${message}${metaStr}`;
}

class Logger {
  constructor(context = {}) {
    this._context = context;
  }

  child(context) {
    return new Logger({ ...this._context, ...context });
  }

  _log(level, message, meta = {}) {
    if (isTest) return;
    if (LEVELS[level] < MIN_LEVEL) return;
    const merged = { ...this._context, ...meta };
    const out = format(level, message, merged);
    if (level === 'error') console.error(out);
    else if (level === 'warn') console.warn(out);
    else console.log(out);
  }

  debug(message, meta)  { this._log('debug', message, meta); }
  info(message, meta)   { this._log('info',  message, meta); }
  warn(message, meta)   { this._log('warn',  message, meta); }
  error(message, meta)  {
    if (meta instanceof Error) {
      this._log('error', message, { err: meta.message, stack: isDev ? meta.stack : undefined });
    } else {
      this._log('error', message, meta);
    }
  }

  // Express middleware: attaches req.log with request context
  static middleware() {
    return (req, res, next) => {
      req.log = logger.child({ requestId: req.id, method: req.method, path: req.path, ip: req.ip });
      const start = Date.now();
      res.on('finish', () => {
        req.log.info('request completed', { status: res.statusCode, ms: Date.now() - start });
      });
      next();
    };
  }
}

export const logger = new Logger({ service: 'jobfast-api' });
export default logger;
