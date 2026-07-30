import type { RequestHandler } from 'express';
import type { GatewayRequest } from '../../types/gateway.types.js';
import { env } from '../../config/env.js';

// Static blocklist loaded from env (comma-separated CIDRs or IPs)
const MANUAL_BLOCKLIST = new Set<string>(
  env.BLOCKED_IPS.split(',').map((s: string) => s.trim()).filter(Boolean)
);

// Known Tor exit node / proxy ranges (sample — replace with live feed in production)
const KNOWN_PROXY_PREFIXES = ['185.220.', '199.249.', '171.25.'];

// Private/loopback/trusted ranges — bypass reputation check
const TRUSTED_PREFIXES = ['127.', '::1', '10.', '172.16.', '172.17.', '172.18.', '172.19.',
  '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
  '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.',
  '192.168.', '::ffff:127.'];

function isTrusted(ip: string): boolean {
  return TRUSTED_PREFIXES.some(p => ip.startsWith(p));
}

function isBlocked(ip: string): { blocked: boolean; reason?: string } {
  if (MANUAL_BLOCKLIST.has(ip)) return { blocked: true, reason: 'manual_blocklist' };
  if (KNOWN_PROXY_PREFIXES.some(p => ip.startsWith(p))) return { blocked: true, reason: 'known_proxy' };
  return { blocked: false };
}

export function blockIP(ip: string): void {
  MANUAL_BLOCKLIST.add(ip);
}

export function unblockIP(ip: string): void {
  MANUAL_BLOCKLIST.delete(ip);
}

export const IPReputation: RequestHandler = (req, res, next) => {
  const ip = (req as GatewayRequest).ctx?.ip ?? req.ip ?? 'unknown';

  if (isTrusted(ip)) return next();

  const { blocked, reason } = isBlocked(ip);
  if (blocked) {
    console.warn(`[IPReputation] Blocked ip=${ip} reason=${reason}`);
    res.status(403).json({ error: 'Access denied', code: 'IP_BLOCKED' });
    return;
  }

  next();
};
