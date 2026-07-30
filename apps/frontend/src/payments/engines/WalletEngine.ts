import type { Wallet, WalletBalance, WalletTransaction, TransferRequest, TransferResult, TopUpRequest, WithdrawalRequest, LoyaltyPoints } from '../types/wallet';

export const WalletEngine = {
  async createWallet(userId: string, type: Wallet['type'], currency: string): Promise<Wallet> {
    const res = await fetch('/api/payments/wallets', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId, type, defaultCurrency: currency }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<Wallet>;
  },

  async getWallet(walletId: string): Promise<Wallet | null> {
    try {
      const res = await fetch(`/api/payments/wallets/${walletId}`);
      return res.ok ? res.json() as Promise<Wallet> : null;
    } catch { return null; }
  },

  async getUserWallets(userId: string): Promise<Wallet[]> {
    try {
      const res = await fetch(`/api/payments/wallets?userId=${userId}`);
      return res.ok ? res.json() as Promise<Wallet[]> : [];
    } catch { return []; }
  },

  async getBalance(walletId: string, currency?: string): Promise<WalletBalance | null> {
    const q = currency ? `?currency=${currency}` : '';
    try {
      const res = await fetch(`/api/payments/wallets/${walletId}/balance${q}`);
      return res.ok ? res.json() as Promise<WalletBalance> : null;
    } catch { return null; }
  },

  async topUp(request: TopUpRequest): Promise<{ success: boolean; balance?: WalletBalance; error?: string }> {
    try {
      const res = await fetch('/api/payments/wallets/topup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(request),
      });
      if (!res.ok) return { success: false, error: await res.text() };
      return res.json() as Promise<{ success: boolean; balance?: WalletBalance }>;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Top-up failed' };
    }
  },

  async transfer(request: TransferRequest): Promise<TransferResult> {
    try {
      const res = await fetch('/api/payments/wallets/transfer', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(request),
      });
      if (!res.ok) return { success: false, error: await res.text() };
      return res.json() as Promise<TransferResult>;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Transfer failed' };
    }
  },

  async withdraw(request: WithdrawalRequest): Promise<{ success: boolean; withdrawalId?: string; error?: string }> {
    try {
      const res = await fetch('/api/payments/wallets/withdraw', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(request),
      });
      if (!res.ok) return { success: false, error: await res.text() };
      return res.json() as Promise<{ success: boolean; withdrawalId?: string }>;
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Withdrawal failed' };
    }
  },

  async getTransactions(walletId: string, options?: { limit?: number; cursor?: string; currency?: string }): Promise<{ items: WalletTransaction[]; nextCursor?: string }> {
    const q = new URLSearchParams({ limit: String(options?.limit ?? 20) });
    if (options?.cursor)   q.set('cursor', options.cursor);
    if (options?.currency) q.set('currency', options.currency);
    try {
      const res = await fetch(`/api/payments/wallets/${walletId}/transactions?${q}`);
      return res.ok ? res.json() as Promise<{ items: WalletTransaction[]; nextCursor?: string }> : { items: [] };
    } catch { return { items: [] }; }
  },

  async freeze(walletId: string, reason?: string): Promise<boolean> {
    const res = await fetch(`/api/payments/wallets/${walletId}/freeze`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason }),
    });
    return res.ok;
  },

  async getLoyaltyPoints(walletId: string): Promise<LoyaltyPoints | null> {
    try {
      const res = await fetch(`/api/payments/wallets/${walletId}/loyalty`);
      return res.ok ? res.json() as Promise<LoyaltyPoints> : null;
    } catch { return null; }
  },
};
