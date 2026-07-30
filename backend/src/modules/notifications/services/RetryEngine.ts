import { NotificationRepository } from '../repositories/NotificationRepository.js';
import { ProviderRegistry }        from '../providers/ChannelProvider.js';
import type { NotifChannel }       from '../types/notification.types.js';
import type { ChannelPayload }     from '../providers/ChannelProvider.js';

const MAX_ATTEMPTS = 3;

function backoffMs(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt - 1), 30_000);
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const RetryEngine = {
  async sendWithRetry(
    notifId:  string,
    channel:  NotifChannel,
    payload:  ChannelPayload,
  ): Promise<boolean> {
    const provider = ProviderRegistry.get(channel);
    if (!provider) {
      await NotificationRepository.createDeadLetter(notifId, channel, 'No provider registered', 0);
      return false;
    }

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const delivery = await NotificationRepository.createDelivery({
        notifId,
        channel,
        provider: provider.name,
        attempt,
      });

      try {
        const result = await provider.send(payload);
        if (result.success) {
          await NotificationRepository.updateDelivery(delivery.id, {
            status: 'delivered',
            sentAt: new Date().toISOString(),
          });
          return true;
        }
        throw new Error(result.error ?? 'Provider returned failure');
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        await NotificationRepository.updateDelivery(delivery.id, {
          status: 'failed',
          error:  errorMsg,
        });
        if (attempt < MAX_ATTEMPTS) await sleep(backoffMs(attempt));
      }
    }

    await NotificationRepository.createDeadLetter(notifId, channel, 'Max retries exceeded', MAX_ATTEMPTS);
    return false;
  },
};