import type { Request, Response, NextFunction } from 'express';
import { BotDetectionService }   from '../services/BotDetectionService.js';
import { DeviceIntelligence }    from '../services/DeviceIntelligence.js';
import { AuditEngine }           from '../services/AuditEngine.js';
import { SecurityMonitor }       from '../services/SecurityMonitor.js';
import type { SecurityContext }  from '../types/security.types.js';

// Extend Express Request with security context
declare global {
  namespace Express {
    interface Request {
      secCtx?: SecurityContext;
    }
  }
}

// Paths excluded from full security context (static assets, health check)
const SKIP_PATHS = new Set(['/health', '/favicon.ico']);

// Audit only security-sensitive actions (not every GET)
const AUDIT_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function extractIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim() ?? req.ip ?? '';
  return req.ip ?? '';
}

function extractCountry(req: Request): string {
  // In production: use Cloudflare CF-IPCountry header or MaxMind
  const cf = req.headers['cf-ipcountry'];
  if (typeof cf === 'string' && cf.length === 2) return cf.toUpperCase();
  return 'HT'; // Default: Haiti
}

export async function securityMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (SKIP_PATHS.has(req.path)) { next(); return; }

  const ip          = extractIP(req);
  const country     = extractCountry(req);
  const userAgent   = req.headers['user-agent'] ?? '';
  const acceptLang  = req.headers['accept-language'] ?? '';
  const tz          = String(req.headers['x-timezone'] ?? '');

  // Check blocked IPs (uses 60-second cache — fast)
  if (ip && await SecurityMonitor.isBlocked(ip)) {
    res.status(403).json({ code: 'IP_BLOCKED', message: 'Aksè refize. Kontakte asistans si ou panse sa se yon erè.' });
    return;
  }

  // Bot detection (synchronous)
  const { isBot, botScore, browser, os, isMobile } = BotDetectionService.analyze(userAgent);
  if (isBot && botScore >= 80) {
    AuditEngine.log({ action: 'security.block', result: 'blocked', ip, country, deviceId: '', userAgent, riskScore: botScore, metadata: { reason: 'bot_detected' } });
    res.status(403).json({ code: 'BOT_DETECTED', message: 'Demann otomatik pa pèmèt.' });
    return;
  }

  // Device fingerprint (synchronous)
  const deviceId = DeviceIntelligence.fingerprint(userAgent, acceptLang, tz);

  // Risk level from bot score
  const riskLevel = botScore >= 70 ? 'high' : botScore >= 40 ? 'medium' : 'low';

  // Attach security context to request
  req.secCtx = { ip, country, deviceId, riskLevel, botScore, isTrusted: false, isBot };

  // Async: log audit for write operations (never blocks request path)
  if (AUDIT_METHODS.has(req.method)) {
    const userId = (req as unknown as { user?: { sub?: string } }).user?.sub;
    const path   = req.path;

    res.on('finish', () => {
      const action = path.includes('/auth')     ? 'auth.login'
                   : path.includes('/payments') ? 'payment.initiated'
                   : path.includes('/wallet')   ? 'wallet.transfer'
                   : path.includes('/admin')    ? 'admin.action'
                   : path.includes('/security') ? 'security.incident'
                   : 'system.write';

      AuditEngine.log({
        action, result: res.statusCode < 400 ? 'success' : res.statusCode === 403 ? 'blocked' : 'failure',
        ip, country, deviceId, userAgent,
        riskScore: botScore,
        ...(userId && { userId }),
        metadata: { method: req.method, path, status: res.statusCode, browser, os, isMobile },
      });
    });
  }

  next();
}