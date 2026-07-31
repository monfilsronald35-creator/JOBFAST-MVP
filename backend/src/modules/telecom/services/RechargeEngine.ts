import { TelecomRepository }    from '../repositories/TelecomRepository.js';
import { TelecomAPIConnector }   from './TelecomAPIConnector.js';
import { FraudService }          from './FraudService.js';
import { CommissionEngine }      from './CommissionEngine.js';
import type { TelecomRecharge, RechargeType } from '../types/telecom.types.js';

export const RechargeEngine = {
  async initiate(input: {
    operatorId: string; userId: string; phone: string; amount: number;
    currency: string; type: RechargeType; bundleId?: string;
    dealerId?: string; scheduledAt?: string;
  }): Promise<TelecomRecharge> {
    const fraudCheck = await FraudService.checkRecharge(input.operatorId, input.userId, input.phone, input.amount);
    if (fraudCheck.blocked) throw new Error('FRAUD_BLOCKED');

    const recharge = await TelecomRepository.createRecharge({
      ...input, status: 'pending',
    });

    if (input.scheduledAt) {
      return recharge;
    }

    void RechargeEngine.process(recharge.id, recharge.operatorId, input.dealerId);
    return recharge;
  },

  async process(rechargeId: string, operatorId: string, dealerId?: string): Promise<void> {
    await TelecomRepository.updateRechargeStatus(rechargeId, 'processing');
    const recharge = await TelecomRepository.getRecharge(rechargeId);
    if (!recharge) return;

    const bundle = recharge.bundleId ? await TelecomRepository.getBundle(recharge.bundleId) : null;

    const result = await TelecomAPIConnector.sendRecharge(operatorId, {
      phone:      recharge.phone,
      amount:     recharge.amount,
      currency:   recharge.currency,
      bundleCode: bundle?.code,
      reference:  rechargeId,
    });

    if (result.success) {
      await TelecomRepository.updateRechargeStatus(rechargeId, 'completed', {
        external_ref: result.externalRef ?? '',
      });

      if (dealerId) {
        const dealer = await TelecomRepository.getDealer(dealerId);
        if (dealer) {
          await CommissionEngine.compute(operatorId, dealer, rechargeId, recharge.amount, 'recharge');
        }
      }
    } else {
      if (result.retryCount < 3) {
        await TelecomRepository.enqueueRetry(
          operatorId, rechargeId,
          1000 * 2 ** result.retryCount,
          result.message ?? 'Unknown error',
        );
      } else {
        await TelecomRepository.updateRechargeStatus(rechargeId, 'failed', {
          fail_reason: result.message ?? 'Max retries exceeded',
        });
      }
    }
  },

  async refund(rechargeId: string, _actorId: string): Promise<void> {
    const recharge = await TelecomRepository.getRecharge(rechargeId);
    if (!recharge || recharge.status !== 'completed') throw new Error('REFUND_NOT_ALLOWED');
    await TelecomRepository.updateRechargeStatus(rechargeId, 'refunded');
  },

  async cancel(rechargeId: string): Promise<void> {
    const recharge = await TelecomRepository.getRecharge(rechargeId);
    if (!recharge || recharge.status !== 'pending') throw new Error('CANCEL_NOT_ALLOWED');
    await TelecomRepository.updateRechargeStatus(rechargeId, 'cancelled');
  },

  async list(filters: { operatorId?: string; userId?: string; dealerId?: string; status?: string; limit?: number }): Promise<TelecomRecharge[]> {
    return TelecomRepository.listRecharges(filters);
  },

  async processRetries(operatorId: string): Promise<void> {
    const due = await TelecomRepository.getDueRetries(operatorId);
    for (const item of due) {
      await TelecomRepository.removeRetry(item.id);
      void RechargeEngine.process(item.rechargeId, operatorId);
    }
  },
};