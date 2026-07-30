import { WalletRepository }                 from '../repositories/WalletRepository.js';
import { WalletService }                    from './WalletService.js';
import { type TransactionFilter, type Transaction } from '../types/wallet.types.js';

export const TransactionService = {
  async list(ownerId: string, filter: TransactionFilter): Promise<{
    data: Transaction[]; nextCursor: string | null;
  }> {
    const wallet = await WalletService.getWallet(ownerId);
    const data   = await WalletRepository.listTransactions(wallet.id, filter);
    const limit  = filter.limit ?? 20;
    const nextCursor = data.length === limit ? (data[data.length - 1]?.createdAt ?? null) : null;
    return { data, nextCursor };
  },

  async getStatement(ownerId: string, fromDate: string, toDate: string, currency?: string): Promise<{
    openingBalance: number; closingBalance: number; totalCredits: number; totalDebits: number;
    transactions: Transaction[]; currency: string;
  }> {
    const wallet = await WalletService.getWallet(ownerId);
    const cur    = currency ?? 'HTG';
    const data   = await WalletRepository.listTransactions(wallet.id, {
      dateFrom: fromDate, dateTo: toDate,
      ...(currency ? { currency } : {}),
      limit: 500,
    });
    let totalCredits = 0;
    let totalDebits  = 0;
    for (const tx of data) {
      if (tx.direction === 'credit') totalCredits += tx.amount;
      else                           totalDebits  += tx.amount;
    }
    const balance        = await WalletRepository.getBalance(wallet.id, cur);
    const closingBalance = balance?.availableBalance ?? 0;
    const openingBalance = closingBalance - totalCredits + totalDebits;
    return { openingBalance, closingBalance, totalCredits, totalDebits, transactions: data, currency: cur };
  },
};
