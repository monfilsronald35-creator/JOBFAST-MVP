/**
 * useWallet — live balance, transactions, escrow, refund status.
 * All amounts in minor units (integer cents).
 */

import { useCallback, useEffect, useState } from 'react';
import { useRealtimeContext } from '../providers/RealtimeProvider';
import type { WalletBalancePayload, LiveTransactionPayload, EscrowPayload } from '../types';

export interface UseWalletReturn {
  readonly balance:      WalletBalancePayload | null;
  readonly transactions: readonly LiveTransactionPayload[];
  readonly escrows:      readonly EscrowPayload[];
  readonly transfer:     (payload: {
    toUserId: string;
    amountMinorUnits: number;
    currency: string;
    description: string;
    idempotencyKey: string;
  }) => void;
  readonly requestSync:  () => void;
}

export function useWallet(userId?: string): UseWalletReturn {
  const { wallet: walletChannel } = useRealtimeContext();
  const [balance,      setBalance]      = useState<WalletBalancePayload | null>(null);
  const [transactions, setTransactions] = useState<LiveTransactionPayload[]>([]);
  const [escrows,      setEscrows]      = useState<EscrowPayload[]>([]);

  useEffect(() => {
    const offBalance = walletChannel.onBalanceUpdate(b => setBalance(b));
    const offTx      = walletChannel.onNewTransaction(tx =>
      setTransactions(prev => [tx, ...prev.filter(t => t._id !== tx._id)].slice(0, 100))
    );
    const offTxStatus = walletChannel.onTransactionStatus(tx =>
      setTransactions(prev => prev.map(t => t._id === tx._id ? tx : t))
    );
    const offEscrow = walletChannel.onEscrowUpdate(e =>
      setEscrows(prev => [e, ...prev.filter(s => s.escrowId !== e.escrowId)])
    );

    return () => { offBalance(); offTx(); offTxStatus(); offEscrow(); };
  }, [walletChannel]);

  const transfer = useCallback((payload: {
    toUserId: string;
    amountMinorUnits: number;
    currency: string;
    description: string;
    idempotencyKey: string;
  }) => {
    if (!userId) return;
    walletChannel.initiateTransfer({ fromUserId: userId, ...payload });
  }, [walletChannel, userId]);

  const requestSync = useCallback(() => {
    if (userId) walletChannel.requestBalanceSync(userId);
  }, [walletChannel, userId]);

  return { balance, transactions, escrows, transfer, requestSync };
}