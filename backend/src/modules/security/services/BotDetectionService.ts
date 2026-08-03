import type { RiskScore } from '../types/security.types.js';

// Known bot/crawler User-Agent patterns
const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /python-requests/i,
  /go-http-client/i, /java\//i, /okhttp/i, /axios/i, /wget/i, /libwww/i,
  /postman/i, /insomnia/i, /httpie/i, /zgrab/i, /masscan/i, /nikto/i,
];

// Allowed automated clients (internal services, CI, known partners)
const ALLOWED_BOTS = [
  /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
  /facebookexternalhit/i, /linkedinbot/i,
];

function parseBrowser(ua: string): string {
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Chrome';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
  if (/Edg\//.test(ua)) return 'Edge';
  if (/OPR\//.test(ua)) return 'Opera';
  return 'Unknown';
}

function parseOS(ua: string): string {
  if (/Windows NT/.test(ua)) return 'Windows';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad/.test(ua)) return 'iOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown';
}

export const BotDetectionService = {
  analyze(userAgent: string): { isBot: boolean; botScore: RiskScore; browser: string; os: string; isMobile: boolean } {
    if (!userAgent) {
      return { isBot: true, botScore: 90, browser: 'Unknown', os: 'Unknown', isMobile: false };
    }

    // Allowed bots (search engines, social previews)
    if (ALLOWED_BOTS.some(p => p.test(userAgent))) {
      return { isBot: true, botScore: 10, browser: 'Bot', os: 'Unknown', isMobile: false };
    }

    // Known malicious bot patterns
    const isBot     = BOT_PATTERNS.some(p => p.test(userAgent));
    const botScore  = isBot ? 85 : 0;
    const browser   = parseBrowser(userAgent);
    const os        = parseOS(userAgent);
    const isMobile  = /Mobile|Android|iPhone|iPad/.test(userAgent);

    return { isBot, botScore, browser, os, isMobile };
  },

  // Detect credential stuffing: many failed logins from same IP
  isCredentialStuffing(recentFailures: number): boolean {
    return recentFailures >= 10;
  },

  // Detect brute force: many requests to auth endpoints in short window
  isBruteForce(requestsInWindow: number, windowSec: number): boolean {
    const rps = requestsInWindow / windowSec;
    return rps > 5; // >5 auth requests/second = brute force
  },
};