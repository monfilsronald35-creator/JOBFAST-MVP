import type { RequestHandler } from 'express';
import type { GatewayRequest } from '../../types/gateway.types.js';

// Known malicious scanner / attack tool user-agents
const BLOCKED_BOT_RE = /\b(sqlmap|nikto|nessus|nmap|masscan|zgrab|dirbuster|gobuster|wfuzz|burpsuite|hydra|medusa|metasploit|havij|acunetix|openvas|w3af|skipfish)\b/i;

// Legitimate crawlers that should be allowed (returns false = don't block)
const ALLOWED_CRAWLERS_RE = /\b(Googlebot|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp)\b/i;

// Headless browser fingerprints
const HEADLESS_RE = /HeadlessChrome|PhantomJS|Selenium|WebDriver|puppeteer/i;

export const BotDetection: RequestHandler = (req, res, next) => {
  const ua = req.headers['user-agent'] ?? '';
  const gReq = req as GatewayRequest;

  // Missing UA on non-public endpoints = suspicious (soft block via flag)
  if (!ua && gReq.ctx?.plan === 'anonymous') {
    gReq.ctx.flags['suspicious_ua'] = true;
  }

  // Allowed crawlers pass through immediately
  if (ALLOWED_CRAWLERS_RE.test(ua)) return next();

  // Known attack tools — hard block
  if (BLOCKED_BOT_RE.test(ua)) {
    const ip = gReq.ctx?.ip ?? req.ip ?? 'unknown';
    console.warn(`[BotDetection] Blocked attack tool ua="${ua.slice(0, 60)}" ip=${ip}`);
    res.status(403).json({ error: 'Access denied', code: 'BOT_BLOCKED' });
    return;
  }

  // Headless browsers — flag but allow (legit automation may use these)
  if (HEADLESS_RE.test(ua)) {
    gReq.ctx.flags['headless_browser'] = true;
  }

  next();
};
