import type { Express }     from 'express';
import { walletRouter }     from './routes/wallet.routes.js';
import { TypedEventBus }    from '../../core/events/TypedEventBus.js';
import { EVENT_NAMES }      from '@shared-events';
import { DomainEvent }      from '../../core/events/DomainEvent.js';
import { WalletRepository } from './repositories/WalletRepository.js';
import { WalletService }    from './services/WalletService.js';
import type { UUID, MinorUnits, Currency } from '@shared-types';

class WalletCreditedEvent extends DomainEvent {
  constructor(public readonly userId: UUID, public readonly amount: MinorUnits, public readonly currency: Currency) {
    super(EVENT_NAMES.WALLET_CREDITED);
  }
}

class WalletDebitedEvent extends DomainEvent {
  constructor(public readonly userId: UUID, public readonly amount: MinorUnits, public readonly currency: Currency) {
    super(EVENT_NAMES.WALLET_DEBITED);
  }
}

export { WalletCreditedEvent, WalletDebitedEvent };

export function registerWalletModule(app: Express): void {
  app.use('/api/wallet', walletRouter);

  TypedEventBus.subscribe(EVENT_NAMES.USER_REGISTERED, async (envelope) => {
    const payload = envelope.payload as unknown as { userId: string };
    await WalletService.getOrCreate(payload.userId).catch(() => undefined);
  });

  TypedEventBus.subscribe(EVENT_NAMES.ESCROW_RELEASED, async (envelope) => {
    const payload = envelope.payload as unknown as {
      userId: UUID; amount: MinorUnits; currency: Currency;
    };
    const wallet = await WalletRepository.findByOwner(payload.userId);
    if (!wallet) return;
    await WalletRepository.credit(
      wallet.id, payload.userId, payload.currency as string, payload.amount as number,
      'escrow_release', 'Escrow released',
    ).catch(() => undefined);
    TypedEventBus.publish(new WalletCreditedEvent(payload.userId, payload.amount, payload.currency));
  });
}
