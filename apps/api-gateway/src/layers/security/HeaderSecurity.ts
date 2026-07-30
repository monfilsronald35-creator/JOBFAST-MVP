import type { RequestHandler } from 'express';
import { env } from '../../config/env.js';

const origins = new Set(env.ALLOWED_ORIGINS.split(',').map((s: string) => s.trim()));

export const HeaderSecurity: RequestHandler = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options',   'nosniff');
  res.setHeader('X-Frame-Options',          'DENY');
  res.setHeader('X-XSS-Protection',         '1; mode=block');
  res.setHeader('Referrer-Policy',          'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy',       'geolocation=(), microphone=(), camera=()');
  res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains; preload');
  res.setHeader('Content-Security-Policy',  "default-src 'self'; frame-ancestors 'none'");
  res.removeHeader('X-Powered-By');
  next();
};

export const CORSHandler: RequestHandler = (req, res, next) => {
  const origin = req.headers['origin'];

  if (origin && origins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin',      origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods',     'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers',     'Content-Type,Authorization,X-API-Key,X-Request-ID,X-Trace-ID,X-App-Version,X-Device-ID');
    res.setHeader('Access-Control-Max-Age',           '86400');
    res.setHeader('Vary', 'Origin');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
};
