import { ProviderRegistry }       from '../providers/ProviderAdapter.js';
import { PaymentRepository }      from '../repositories/PaymentRepository.js';
import { RoutingEngine }          from './RoutingEngine.js';
import { PaymentStatus, ProviderName } from '../types/payment.types.js';
import type { ProviderResult }    from '../types/provider.types.js';

export const FailoverEngine = {
  async execute(
    intentId: string,
    amount: number, currency: string, method: string,
    country: string,
    metadata: Record<string, unknown> = {}
  ): Promise<{ success: boolean; result: ProviderResult; usedProvider: ProviderName }> {
    const chain   = await RoutingEngine.getFailoverChain(country, currency, method);
    let attempt   = 0;
    let lastResult: ProviderResult = { success: false, status: PaymentStatus.Failed };

    for (const providerName of chain) {
      attempt++;
      const adapter = ProviderRegistry.get(providerName);
      try {
        const result = await adapter.charge(amount, currency, method, metadata);
        // Record the transaction attempt
        await PaymentRepository.createTransaction({
          intentId, provider: providerName,
          amount, fee: result.fee ?? 0, currency,
          status: result.status, attempt,
          ...(result.providerTxId  ? { providerTxId:  result.providerTxId }  : {}),
          ...(result.errorCode     ? { errorCode:     result.errorCode }     : {}),
          ...(result.errorMessage  ? { errorMessage:  result.errorMessage }  : {}),
          ...(result.rawResponse   ? { rawResponse:   result.rawResponse }   : {}),
        });
        if (result.success) return { success: true, result, usedProvider: providerName };
        lastResult = result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        await PaymentRepository.createTransaction({
          intentId, provider: providerName,
          amount, fee: 0, currency,
          status: PaymentStatus.Failed, attempt,
          errorCode: 'ADAPTER_ERROR', errorMessage: msg,
        });
        lastResult = { success: false, status: PaymentStatus.Failed, errorCode: 'ADAPTER_ERROR', errorMessage: msg };
      }
    }

    return { success: false, result: lastResult, usedProvider: chain[0] ?? ProviderName.Stripe };
  },
};
