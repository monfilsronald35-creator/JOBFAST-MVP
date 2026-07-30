import { db } from '../../../core/database/SupabaseClient.js';
import { RiskLevel, type RiskAssessment } from '../types/identity.types.js';

// Known VPN/proxy CIDR prefixes (sample — replace with live feed in production)
const PROXY_PREFIXES   = ['185.220.', '199.249.', '171.25.', '104.244.'];
const INTERNAL_PREFIXES = ['127.', '10.', '172.16.', '192.168.', '::1'];

interface RiskContext {
  userId:       string;
  ip?:          string;
  countryCode?: string;
  deviceId?:    string;
  isNewDevice:  boolean;
  userAgent?:   string;
}

async function recentFailedAttempts(userId: string): Promise<number> {
  try {
    const since = new Date(Date.now() - 15 * 60_000).toISOString();
    const rows = await db.query(client =>
      client.from('identity_audit_log')
        .select('id')
        .eq('user_id', userId)
        .eq('event_type', 'login_failed')
        .gte('created_at', since)
    );
    return (rows as unknown[]).length;
  } catch {
    return 0;
  }
}

async function userPreviousCountries(userId: string): Promise<Set<string>> {
  try {
    const rows = await db.query(client =>
      client.from('identity_sessions')
        .select('country_code')
        .eq('user_id', userId)
        .not('country_code', 'is', null)
    ) as Array<{ country_code: string }>;
    return new Set(rows.map(r => r.country_code));
  } catch {
    return new Set();
  }
}

function isProxy(ip: string): boolean {
  return PROXY_PREFIXES.some(p => ip.startsWith(p));
}

function isInternal(ip: string): boolean {
  return INTERNAL_PREFIXES.some(p => ip.startsWith(p));
}

function isHeadless(ua: string): boolean {
  return /HeadlessChrome|PhantomJS|puppeteer|selenium/i.test(ua);
}

export const RiskEngine = {
  async assess(ctx: RiskContext): Promise<RiskAssessment> {
    const flags: string[] = [];
    let   score = 0;

    // New device — moderate risk
    if (ctx.isNewDevice) {
      flags.push('new_device');
      score += 20;
    }

    // Internal/loopback IPs are trusted
    const ip = ctx.ip ?? '';
    if (!isInternal(ip)) {
      // VPN / Proxy
      if (isProxy(ip)) {
        flags.push('vpn_or_proxy');
        score += 30;
      }

      // New country
      if (ctx.countryCode) {
        const known = await userPreviousCountries(ctx.userId);
        if (known.size > 0 && !known.has(ctx.countryCode)) {
          flags.push('new_country');
          score += 25;
        }
      }
    }

    // Too many failed attempts
    const failed = await recentFailedAttempts(ctx.userId);
    if (failed >= 5) {
      flags.push('excessive_failed_attempts');
      score += 40;
    } else if (failed >= 3) {
      flags.push('multiple_failed_attempts');
      score += 15;
    }

    // Headless browser
    if (ctx.userAgent && isHeadless(ctx.userAgent)) {
      flags.push('headless_browser');
      score += 35;
    }

    // Determine level and action
    score = Math.min(score, 100);

    let level:  RiskLevel;
    let action: RiskAssessment['action'];

    if (score >= 80) {
      level  = RiskLevel.Critical;
      action = 'block';
    } else if (score >= 55) {
      level  = RiskLevel.High;
      action = 'otp_required';
    } else if (score >= 30) {
      level  = RiskLevel.Medium;
      action = 'mfa_required';
    } else {
      level  = RiskLevel.Low;
      action = 'allow';
    }

    return { score, level, flags, action };
  },

  async recordAudit(userId: string | null, eventType: string, data: Record<string, unknown>, ip?: string, riskScore?: number): Promise<void> {
    try {
      await db.query(client =>
        client.from('identity_audit_log').insert({
          user_id:    userId ?? null,
          event_type: eventType,
          event_data: data,
          ip_address: ip ?? null,
          risk_score: riskScore ?? null,
        }).select()
      );
    } catch {
      // Non-critical — don't fail the request
    }
  },
};
