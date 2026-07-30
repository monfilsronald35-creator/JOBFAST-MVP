import type { RequestHandler } from 'express';
import type { GatewayRequest } from '../../types/gateway.types.js';
import { env } from '../../config/env.js';

interface WindowEntry {
  count:      number;
  windowStart: number;
  blocked?:   boolean;
  blockUntil?: number;
}

const windows = new Map<string, WindowEntry>();
const BLOCK_DURATION_MS = 5 * 60_000; // 5 minutes

// Evict expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of windows) {
    if (now - entry.windowStart > env.DDOS_WINDOW_MS * 2) windows.delete(ip);
  }
}, 5 * 60_000).unref();

export function isDDoSBlocked(ip: string): boolean {
  const entry = windows.get(ip);
  if (!entry) return false;
  if (entry.blocked && entry.blockUntil && Date.now() < entry.blockUntil) return true;
  if (entry.blocked) {
    entry.blocked = false;
    delete entry.blockUntil;
  }
  return false;
}

export const DDoSProtection: RequestHandler = (req, res, next) => {
  const ip = (req as GatewayRequest).ctx?.ip ?? req.ip ?? 'unknown';
  const now = Date.now();

  let entry = windows.get(ip);
  if (!entry || now - entry.windowStart > env.DDOS_WINDOW_MS) {
    entry = { count: 1, windowStart: now };
    windows.set(ip, entry);
    return next();
  }

  if (entry.blocked && entry.blockUntil && now < entry.blockUntil) {
    res.status(429).json({ error: 'Too many requests — IP temporarily blocked', code: 'DDOS_BLOCK', retryAfter: Math.ceil((entry.blockUntil - now) / 1000) });
    return;
  }

  entry.count++;

  if (entry.count > env.DDOS_THRESHOLD) {
    entry.blocked    = true;
    entry.blockUntil = now + BLOCK_DURATION_MS;
    console.warn(`[DDoS] Blocking ip=${ip} count=${entry.count} until=${new Date(entry.blockUntil).toISOString()}`);
    res.status(429).json({ error: 'DDoS protection triggered', code: 'DDOS_BLOCK', retryAfter: BLOCK_DURATION_MS / 1000 });
    return;
  }

  // Warn at 70% threshold
  if (entry.count > env.DDOS_THRESHOLD * 0.7) {
    console.warn(`[DDoS] Warning ip=${ip} count=${entry.count}/${env.DDOS_THRESHOLD}`);
  }

  next();
};

export function getDDoSStats(): { monitoredIPs: number; blockedIPs: number } {
  let blockedIPs = 0;
  const now = Date.now();
  for (const entry of windows.values()) {
    if (entry.blocked && entry.blockUntil && now < entry.blockUntil) blockedIPs++;
  }
  return { monitoredIPs: windows.size, blockedIPs };
}
