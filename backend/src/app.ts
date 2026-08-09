import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { registerAllModules }      from './modules/index.js';
import { securityMiddleware }      from './modules/security/middleware/securityMiddleware.js';
import { localizationMiddleware }  from './modules/localization/index.js';
import { errorHandler, notFoundHandler } from './core/middleware/errorHandler.middleware.js';

export function createApp(): Express {
  const app = express();

  const isProd = process.env['NODE_ENV'] === 'production';

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'"],
        styleSrc:   ["'self'", "'unsafe-inline'"],
        imgSrc:     ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'wss://jobfast-backend.onrender.com', 'https://*.supabase.co'],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: isProd ? { maxAge: 31_536_000, includeSubDomains: true, preload: true } : false,
  }));

  const ALLOWED_ORIGINS_DEFAULT = isProd
    ? 'https://jobfast-mvp-spzy.vercel.app,https://jobfasthq.com,https://app.jobfasthq.com'
    : 'http://localhost:5173';

  app.use(cors({
    origin: (process.env['ALLOWED_ORIGINS'] ?? ALLOWED_ORIGINS_DEFAULT).split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-internal', 'x-user-country', 'x-gps-country', 'x-sim-mcc'],
    credentials: true,
  }));

  // Request parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(compression() as express.RequestHandler);

  // Logging
  if (process.env['NODE_ENV'] !== 'test') {
    app.use(morgan('combined'));
  }

  // Rate limiting
  const globalLimiter = rateLimit({
    windowMs: Number(process.env['RATE_LIMIT_WINDOW_MS'] ?? 60_000),
    max:      Number(process.env['RATE_LIMIT_MAX']        ?? 200),
    standardHeaders: true,
    legacyHeaders:   false,
    message: { code: 'RATE_LIMIT_EXCEEDED', message: 'Twò anpil demann. Tanpri tann yon ti moman.' },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      20,
    message:  { code: 'RATE_LIMIT_EXCEEDED', message: 'Twò anpil tantativ. Tanpri tann 15 minit.' },
  });

  app.use(globalLimiter);
  app.use('/api/auth/login',    authLimiter);
  app.use('/api/auth/register', authLimiter);

  // Health check (public, no auth)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0.0', timestamp: Date.now(), env: process.env['NODE_ENV'] });
  });

  // Security Platform — runs before ALL domain modules
  app.use(securityMiddleware);

  // Localization — attaches req.locCtx (country context) to every request
  app.use(localizationMiddleware);

  // Domain modules
  registerAllModules(app);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}