/**
 * WalletChannel — instant transfers, live balance, transactions, escrow, refunds.
 * All monetary values in minor units (integer cents) per governance rules.
 */

import { BaseChannel } from './BaseChannel';
import type { RealtimeEngine } from '../core/RealtimeEngine';
import type {
  WalletBalancePayload, LiveTransactionPayload, EscrowPayload,
} from '../types';

export class WalletChannel extends BaseChannel {
  constructor(engine: RealtimeEngine) {
    super(engine, 'wallet');
  }

  // ── Subscribe ───────────────────────────────────────────────────────────────

  subscribe(userId: string): void {
    this.engine.emit('wallet:subscribe', { userId }, 'critical');
    this.joinRoom(`wallet:${userId}`);
  }

  unsubscribe(userId: string): void {
    this.engine.emit('wallet:unsubscribe', { userId }, 'normal');
    this.leaveRoom(`wallet:${userId}`);
  }

  // ── Live balance ─────────────────────────────────────────────────────────────

  onBalanceUpdate(handler: (balance: WalletBalancePayload) => void): () => void {
    return this.onGlobal('wallet:balance:update', handler);
  }

  requestBalanceSync(userId: string): void {
    this.engine.emit('wallet:balance:sync', { userId }, 'high');
  }

  // ── Live transactions ────────────────────────────────────────────────────────

  onNewTransaction(handler: (tx: LiveTransactionPayload) => void): () => void {
    return this.onGlobal('wallet:transaction:new', handler);
  }

  onTransactionStatus(handler: (tx: LiveTransactionPayload) => void): () => void {
    return this.onGlobal('wallet:transaction:status', handler);
  }

  // ── Instant transfer ──────────────────────────────────────────────────────────

  initiateTransfer(payload: {
    fromUserId: string;
    toUserId: string;
    amountMinorUnits: number;
    currency: string;
    description: string;
    idempotencyKey: string;
  }): void {
    this.engine.emit('wallet:transfer:initiate', payload, 'critical');
  }

  onTransferConfirmed(handler: (tx: LiveTransactionPayload) => void): () => void {
    return this.onGlobal('wallet:transfer:confirmed', handler);
  }

  onTransferFailed(handler: (data: { idempotencyKey: string; reason: string }) => void): () => void {
    return this.onGlobal('wallet:transfer:failed', handler);
  }

  // ── Payment status ───────────────────────────────────────────────────────────

  onPaymentStatus(handler: (data: { paymentId: string; status: 'pending' | 'processing' | 'completed' | 'failed' }) => void): () => void {
    return this.onGlobal('wallet:payment:status', handler);
  }

  // ── Escrow ────────────────────────────────────────────────────────────────────

  subscribeToEscrow(escrowId: string): void {
    this.engine.emit('wallet:escrow:subscribe', { escrowId }, 'high');
    this.joinRoom(`escrow:${escrowId}`);
  }

  onEscrowUpdate(handler: (escrow: EscrowPayload) => void): () => void {
    return this.onGlobal('wallet:escrow:update', handler);
  }

  onEscrowReleased(handler: (data: { escrowId: string; amountMinorUnits: number; currency: string }) => void): () => void {
    return this.onGlobal('wallet:escrow:released', handler);
  }

  onEscrowDisputed(handler: (data: { escrowId: string; reason: string }) => void): () => void {
    return this.onGlobal('wallet:escrow:disputed', handler);
  }

  releaseEscrow(escrowId: string, releaseCode: string): void {
    this.engine.emit('wallet:escrow:release', { escrowId, releaseCode }, 'critical');
  }

  // ── Refunds ──────────────────────────────────────────────────────────────────

  onRefundStatus(handler: (data: {
    refundId: string;
    transactionId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    amountMinorUnits: number;
  }) => void): () => void {
    return this.onGlobal('wallet:refund:status', handler);
  }
}