import { ProviderRepository }           from '../repositories/ProviderRepository.js';
import { ProviderName, ProviderStatus } from '../types/payment.types.js';
import type { ProviderConfig, RouteScore, RouteDecision } from '../types/provider.types.js';

// Country → preferred provider order (bootstrap fallback if DB config is sparse)
const COUNTRY_PREFERENCES: Record<string, ProviderName[]> = {
  HT: [ProviderName.MonCash, ProviderName.NatCash, ProviderName.Digicel, ProviderName.Stripe],
  US: [ProviderName.Stripe, ProviderName.Braintree, ProviderName.PayPal],
  CA: [ProviderName.Stripe, ProviderName.PayPal, ProviderName.Braintree],
  GB: [ProviderName.Stripe, ProviderName.Adyen, ProviderName.OpenBanking],
  FR: [ProviderName.Stripe, ProviderName.Adyen, ProviderName.SEPA],
  DE: [ProviderName.Adyen, ProviderName.Stripe, ProviderName.SEPA],
  IT: [ProviderName.Stripe, ProviderName.Adyen, ProviderName.SEPA],
  ES: [ProviderName.Stripe, ProviderName.Adyen, ProviderName.SEPA],
  NL: [ProviderName.Adyen, ProviderName.Stripe, ProviderName.SEPA],
  BR: [ProviderName.Braintree, ProviderName.PayPal, ProviderName.Stripe],
  MX: [ProviderName.Braintree, ProviderName.PayPal, ProviderName.Stripe],
  JP: [ProviderName.Stripe, ProviderName.Adyen],
  KE: [ProviderName.MPesa, ProviderName.AirtelMoney, ProviderName.Stripe],
  TZ: [ProviderName.MPesa, ProviderName.AirtelMoney],
  NG: [ProviderName.MTNMoMo, ProviderName.AirtelMoney, ProviderName.Stripe],
  GH: [ProviderName.MTNMoMo, ProviderName.AirtelMoney],
  CI: [ProviderName.OrangeMoney, ProviderName.MTNMoMo],
  SN: [ProviderName.OrangeMoney],
  ZA: [ProviderName.Stripe, ProviderName.PayPal],
};

function scoreProvider(config: ProviderConfig): RouteScore {
  const availabilityScore = config.status === ProviderStatus.Active   ? 1.0
    :                       config.status === ProviderStatus.Degraded ? 0.4 : 0;
  // Fee score: lower fee = higher score (max fee ~ 500 bps)
  const costScore    = Math.max(0, 1 - config.feePercentage / 500);
  // Speed score: lower latency = higher score (max latency we tolerate = 5000ms)
  const speedScore   = Math.max(0, 1 - config.avgLatencyMs / 5000);
  // Success rate score
  const successRate  = config.avgSuccessRate / 100;
  // Composite: 40% success, 30% cost, 20% speed, 10% availability
  const score = (successRate * 0.40) + (costScore * 0.30) + (speedScore * 0.20) + (availabilityScore * 0.10);
  return {
    provider: config.name, score,
    successRate: config.avgSuccessRate, costScore, speedScore, availabilityScore,
    isAvailable: availabilityScore > 0,
  };
}

export const RoutingEngine = {
  async selectRoute(country: string, currency: string, method: string): Promise<RouteDecision> {
    const eligible = await ProviderRepository.findEligible(country, currency, method);

    if (eligible.length === 0) {
      // Fallback: try Stripe as global last resort
      return {
        selectedProvider: ProviderName.Stripe,
        candidates: [],
        reason: `No eligible provider for ${country}/${currency}/${method} — using Stripe fallback`,
      };
    }

    // Score each provider
    const scores  = eligible.map(scoreProvider).filter(s => s.isAvailable);
    scores.sort((a, b) => b.score - a.score);

    const preferred = COUNTRY_PREFERENCES[country.toUpperCase()] ?? [];

    // If top scorer is already preferred, use it; otherwise give a boost to preferred
    let selected = scores[0];
    if (!selected) {
      return { selectedProvider: ProviderName.Stripe, candidates: [], reason: 'All providers down, using Stripe' };
    }

    // Preference bonus: bump preferred providers' order if within 5% score of top
    if (preferred.length > 0) {
      for (const pref of preferred) {
        const found = scores.find(s => s.provider === pref);
        if (found && found.score >= (selected!.score - 0.05)) { selected = found; break; }
      }
    }

    return {
      selectedProvider: selected.provider,
      candidates: scores,
      reason: `Best route: success=${selected.successRate}%, cost_score=${selected.costScore.toFixed(2)}, speed=${selected.speedScore.toFixed(2)}`,
    };
  },

  // Returns ordered list for failover
  async getFailoverChain(country: string, currency: string, method: string): Promise<ProviderName[]> {
    const decision = await RoutingEngine.selectRoute(country, currency, method);
    const ordered  = decision.candidates.filter(c => c.isAvailable).map(c => c.provider);
    // Put selected first
    const rest     = ordered.filter(p => p !== decision.selectedProvider);
    return [decision.selectedProvider, ...rest];
  },
};
