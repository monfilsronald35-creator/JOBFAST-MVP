import { FraudDetectionService } from './FraudDetectionService.js';

interface VerificationInput {
  userId:    string;
  amount:    number;
  currency:  string;
  method:    string;
  country?:  string | undefined;
  ip?:       string | undefined;
  deviceId?: string | undefined;
  kycLevel?: number | undefined;
}

interface VerificationResult {
  approved:    boolean;
  require3DS:  boolean;
  reason?:     string | undefined;
  fraudScore:  number;
  factors:     Record<string, number>;
}

export const RiskVerificationService = {
  async verify(input: VerificationInput): Promise<VerificationResult> {
    const ctx: Parameters<typeof FraudDetectionService.analyze>[0] = {
      userId: input.userId, amount: input.amount,
      currency: input.currency, method: input.method,
    };
    const c = ctx as unknown as Record<string, unknown>;
    if (input.ip)       c['ip']       = input.ip;
    if (input.country)  c['country']  = input.country;
    if (input.deviceId) c['deviceId'] = input.deviceId;

    const fraud = await FraudDetectionService.analyze(ctx);

    // KYC level gates: level 0 = unverified, max 1M; level 1 = 10M; level 2+ = unlimited
    const kycLevel = input.kycLevel ?? 0;
    const kycLimit = kycLevel === 0 ? 1_000_000 : kycLevel === 1 ? 10_000_000 : Infinity;
    if (input.amount > kycLimit) {
      return {
        approved: false, require3DS: false,
        reason: `KYC level ${kycLevel} limit exceeded`,
        fraudScore: fraud.score, factors: fraud.factors,
      };
    }

    if (fraud.decision === 'block') {
      return {
        approved: false, require3DS: false,
        reason: `Fraud risk too high (score: ${fraud.score})`,
        fraudScore: fraud.score, factors: fraud.factors,
      };
    }

    return {
      approved:   true,
      require3DS: fraud.decision === 'require_3ds',
      fraudScore: fraud.score,
      factors:    fraud.factors,
      ...(fraud.decision === 'review' ? { reason: 'Flagged for review' } : {}),
    };
  },
};
