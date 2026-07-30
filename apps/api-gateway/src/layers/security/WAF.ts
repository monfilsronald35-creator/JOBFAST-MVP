import type { RequestHandler } from 'express';
import type { GatewayRequest, WAFMatch } from '../../types/gateway.types.js';

// OWASP-based detection patterns
const PATTERNS: Array<{ type: WAFMatch['type']; re: RegExp }> = [
  // SQL injection
  {
    type: 'sqli',
    re: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|TRUNCATE|DECLARE)\b|--|;|\/\*|\*\/|xp_|CAST\s*\(|CONVERT\s*\(|CHAR\s*\(|WAITFOR\s+DELAY)/i,
  },
  // Cross-site scripting
  {
    type: 'xss',
    re: /(<script|<\/script|javascript:|vbscript:|data:text\/html|on\w+\s*=|<iframe|<object|<embed|<link\s+rel|<meta\s|<img[^>]+\bonerror|eval\s*\(|document\.cookie|window\.location)/i,
  },
  // NoSQL injection
  {
    type: 'nosql',
    re: /(\$where|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$or\b|\$and\b|\$not\b|\$nor\b|\$regex|\$exists|\$type|\$mod|\$all|\$size|\$elemMatch)/i,
  },
  // Path traversal
  {
    type: 'path_traversal',
    re: /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/|\.\.%2f|%252e%252e)/i,
  },
  // Remote code execution patterns
  {
    type: 'rce',
    re: /(`[^`]*`|\$\([^)]*\)|system\s*\(|exec\s*\(|passthru\s*\(|shell_exec\s*\(|popen\s*\(|proc_open\s*\(|python\s+-c|php\s+-r|bash\s+-c|curl\s+http)/i,
  },
];

function scanValue(value: string, field: string): WAFMatch | null {
  const decoded = decodeURISafe(value);
  for (const { type, re } of PATTERNS) {
    if (re.test(decoded)) {
      return { type, pattern: re.source.slice(0, 40), field };
    }
  }
  return null;
}

function decodeURISafe(s: string): string {
  try {
    return decodeURIComponent(s.replace(/\+/g, ' '));
  } catch {
    return s;
  }
}

function flattenToStrings(obj: unknown, prefix = ''): Array<[string, string]> {
  if (typeof obj === 'string') return [[prefix, obj]];
  if (typeof obj === 'number' || typeof obj === 'boolean') return [[prefix, String(obj)]];
  if (Array.isArray(obj)) {
    return obj.flatMap((v, i) => flattenToStrings(v, `${prefix}[${i}]`));
  }
  if (obj && typeof obj === 'object') {
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      flattenToStrings(v, prefix ? `${prefix}.${k}` : k)
    );
  }
  return [];
}

export const WAF: RequestHandler = (req, res, next) => {
  const gReq = req as GatewayRequest;

  // Scan query params
  const pairs: Array<[string, string]> = flattenToStrings(req.query, 'query');

  // Scan body (only if parsed — text/plain or JSON)
  if (req.body && typeof req.body === 'object') {
    pairs.push(...flattenToStrings(req.body, 'body'));
  } else if (typeof req.body === 'string') {
    pairs.push(['body', req.body]);
  }

  // Scan selected headers (User-Agent, Referer, Accept-Language only)
  const scanHeaders = ['user-agent', 'referer', 'x-forwarded-for'];
  for (const h of scanHeaders) {
    const v = req.headers[h];
    if (typeof v === 'string') pairs.push([`header:${h}`, v]);
  }

  for (const [field, value] of pairs) {
    const match = scanValue(value, field);
    if (match) {
      const ip = gReq.ctx?.ip ?? req.ip ?? 'unknown';
      console.warn(`[WAF] BLOCKED ${match.type} in ${field} — ip=${ip} path=${req.path}`);
      res.status(403).json({ error: 'Request blocked by security policy', code: 'WAF_BLOCKED' });
      return;
    }
  }

  next();
};
