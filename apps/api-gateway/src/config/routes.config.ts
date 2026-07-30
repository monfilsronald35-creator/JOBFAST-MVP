import type { RouteDefinition } from '../types/gateway.types.js';
import { env } from './env.js';

const B = env.BACKEND_URL;

export const ROUTE_MAP: Record<string, RouteDefinition> = {
  '/health':        { backend: `${B}/api/health`,        public: true,  cacheTtl: 10 },
  '/auth':          { backend: `${B}/api/auth`,           public: true  },
  '/users':         { backend: `${B}/api/users` },
  '/jobs':          { backend: `${B}/api/jobs`,           publicMethods: ['GET'], cacheTtl: 15 },
  '/marketplace':   { backend: `${B}/api/marketplace`,    publicMethods: ['GET'], cacheTtl: 30 },
  '/wallet':        { backend: `${B}/api/wallet` },
  '/payments':      { backend: `${B}/api/payments` },
  '/chat':          { backend: `${B}/api/chat` },
  '/notifications': { backend: `${B}/api/notifications` },
  '/search':        { backend: `${B}/api/search`,         public: true,  cacheTtl: 20 },
  '/media':         { backend: `${B}/api/media`,          maxBodySize: 100 },
  '/maps':          { backend: `${B}/api/maps`,           publicMethods: ['GET'], cacheTtl: 60 },
  '/analytics':     { backend: `${B}/api/analytics` },
  '/travel':        { backend: `${B}/api/travel`,         publicMethods: ['GET'], cacheTtl: 120 },
  '/telecom':       { backend: `${B}/api/telecom` },
  '/enterprise':    { backend: `${B}/api/enterprise`,     roles: ['enterprise', 'admin', 'superadmin'] },
  '/admin':         { backend: `${B}/api/admin`,          roles: ['admin', 'superadmin'] },
  '/ai':            { backend: `${B}/api/ai` },
};

export const PUBLIC_EXACT_PATHS = new Set([
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/forgot-password',
  '/api/v1/health',
  '/health',
  '/metrics',
]);

export const API_VERSIONS = ['v1', 'v2', 'v3'] as const;
export type APIVersion = (typeof API_VERSIONS)[number];
