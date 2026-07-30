import { useState, useEffect, useCallback } from 'react';
import type { Wallet, WalletBalance, WalletTransaction, TransferRequest, TopUpRequest, WithdrawalRequest } from '../types/wallet';
import { WalletEngine } from '../engines/WalletEngine';

export function useWallet(userId: string) {
  const [wallets,  setWallets]  = useState<Wallet[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const loadWallets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const w = await WalletEngine.getUserWallets(userId);
      setWallets(w);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallets');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { if (userId) void loadWallets(); }, [loadWallets, userId]);

  const topUp = useCallback(async (request: TopUpRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await WalletEngine.topUp(request);
      if (result.success) await loadWallets();
      else setError(result.error ?? 'Top-up failed');
      return result;
    } finally {
      setLoading(false);
    }
  }, [loadWallets]);

  const transfer = useCallback(async (request: TransferRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await WalletEngine.transfer(request);
      if (result.success) await loadWallets();
      else setError(result.error ?? 'Transfer failed');
      return result;
    } finally {
      setLoading(false);
    }
  }, [loadWallets]);

  const withdraw = useCallback(async (request: WithdrawalRequest) => {
    setLoading(true);
    setError(null);
    try {
      const result = await WalletEngine.withdraw(request);
      if (result.success) await loadWallets();
      else setError(result.error ?? 'Withdrawal failed');
      return result;
    } finally {
      setLoading(false);
    }
  }, [loadWallets]);

  const getBalance = useCallback((walletId: string, currency?: string): WalletBalance | undefined => {
    const wallet = wallets.find(w => w.id === walletId);
    return currency ? wallet?.balances.find(b => b.currency === currency) : wallet?.balances[0];
  }, [wallets]);

  return { wallets, loading, error, topUp, transfer, withdraw, getBalance, refresh: loadWallets };
}

export function useWalletTransactions(walletId: string, currency?: string) {
  const [items,      setItems]      = useState<WalletTransaction[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const load = useCallback(async (cursor?: string) => {
    setLoading(true);
    try {
      const res = await WalletEngine.getTransactions(walletId, { limit: 20, cursor, currency });
      if (cursor) setItems(prev => [...prev, ...res.items]);
      else setItems(res.items);
      setNextCursor(res.nextCursor);
    } finally {
      setLoading(false);
    }
  }, [walletId, currency]);

  useEffect(() => { if (walletId) void load(); }, [load, walletId]);

  return { items, loading, nextCursor, loadMore: () => load(nextCursor), refresh: () => load() };
}
