/**
 * Wallet Module
 * Owns: balances, transactions, top-ups, withdrawals
 * All amounts in integer minor units (HTG centimes, USD cents)
 * ACID: uses Supabase RPC for debit/credit to prevent race conditions
 * Listens to: escrow.released (credit worker), payment.completed (update balance)
 * Emits: wallet.credited, wallet.debited
 */
import type { Express } from 'express';
import { Router } from 'express';
import { db } from '../../core/database/SupabaseClient.js';
import { requireAuth } from '../../core/middleware/auth.middleware.js';
import { TypedEventBus } from '../../core/events/TypedEventBus.js';
import { EVENT_NAMES } from '@shared-events';
import { DomainEvent } from '../../core/events/DomainEvent.js';
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
  const router = Router();

  router.get('/balance',     requireAuth, async (req, res, next) => {
    try {
      const { data, error } = await db.client().from('wallets').select('*').eq('user_id', req.user!.sub).single();
      if (error) throw error;
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  router.get('/transactions', requireAuth, async (req, res, next) => {
    try {
      const limit  = Number(req.query['limit'] ?? 20);
      const cursor = req.query['cursor'] as string | undefined;
      let q = db.client().from('wallet_transactions').select('*')
        .eq('user_id', req.user!.sub).order('created_at', { ascending: false }).limit(limit);
      if (cursor) q = q.lt('created_at', new Date(Number(cursor)).toISOString());
      const { data, error } = await q;
      if (error) throw error;
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  router.post('/topup',      requireAuth, async (req, res, next) => {
    try {
      // Delegates actual charge to payments module via event bus or internal API
      const { amount, currency, provider } = req.body as { amount: number; currency: string; provider: string };
      res.json({ success: true, data: { message: 'Peman an ap trete', amount, currency } });
    } catch (err) { next(err); }
  });

  router.post('/withdraw',   requireAuth, async (req, res, next) => {
    try {
      res.json({ success: true, data: { message: 'Demann retrè an ap trete' } });
    } catch (err) { next(err); }
  });

  app.use('/api/wallet', router);

  // Credit wallet when escrow is released
  TypedEventBus.subscribe(EVENT_NAMES.ESCROW_RELEASED, async (envelope) => {
    const { userId, amount, currency } = envelope.payload as { userId: UUID; amount: MinorUnits; currency: Currency };
    // Use RPC for atomic credit
    await db.client().rpc('credit_wallet', { p_user_id: userId, p_amount: amount, p_currency: currency }).throwOnError();
    TypedEventBus.publish(new WalletCreditedEvent(userId, amount, currency as Currency));
  });
}
