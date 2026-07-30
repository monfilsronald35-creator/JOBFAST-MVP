// Real-time fraud scoring for payment orchestration
// Separate from the wallet RiskEngine — focused on payment-specific patterns

const HIGH_RISK_COUNTRIES = new Set(['IR', 'KP', 'CU', 'SY', 'SD']);
const VELOCITY_WINDOW_MS  = 10 * 60 * 1000; // 10 minutes

interface PaymentContext {
  userId:    string;
  amount:    number;
  currency:  string;
  method:    string;
  ip?:       string | undefined;
  deviceId?: string | undefined;
  country?:  string | undefined;
}

interface FraudScore {
  score:     number;
  decision:  'allow' | 'review' | 'require_3ds' | 'block';
  factors:   Record<string, number>;
}

// In-memory velocity tracker (production: use Redis)
const velocityTracker = new Map<string, Array<{ amount: number; ts: number }>>();

export const FraudDetectionService = {
  async analyze(ctx: PaymentContext): Promise<FraudScore> {
    const factors: Record<string, number> = {};
    let score = 0;

    // High-risk country
    if (ctx.country && HIGH_RISK_COUNTRIES.has(ctx.country.toUpperCase())) {
      factors['sanctioned_country'] = 40; score += 40;
    }

    // Large amount
    if (ctx.amount > 100_000_000)       { factors['very_large_amount'] = 30; score += 30; }
    else if (ctx.amount > 10_000_000)   { factors['large_amount']      = 15; score += 15; }

    // Velocity check
    const key    = `${ctx.userId}`;
    const now    = Date.now();
    const recent = (velocityTracker.get(key) ?? []).filter(e => now - e.ts < VELOCITY_WINDOW_MS);
    if (recent.length >= 5) { factors['high_velocity']  = 25; score += 25; }
    if (recent.length >= 3) { factors['medium_velocity'] = 10; score += 10; }
    // Update tracker
    recent.push({ amount: ctx.amount, ts: now });
    velocityTracker.set(key, recent);

    // No IP (anonymous)
    if (!ctx.ip)       { factors['no_ip']       = 5; score += 5; }

    // No device ID
    if (!ctx.deviceId) { factors['no_device']   = 5; score += 5; }

    // Crypto higher risk
    if (ctx.method === 'crypto') { factors['crypto_method'] = 10; score += 10; }

    const capped = Math.min(100, score);
    const decision = capped >= 70 ? 'block'
      :            capped >= 50 ? 'require_3ds'
      :            capped >= 30 ? 'review'
      :            'allow';

    return { score: capped, decision, factors };
  },

  clearVelocityForUser(userId: string): void {
    velocityTracker.delete(userId);
  },
};
