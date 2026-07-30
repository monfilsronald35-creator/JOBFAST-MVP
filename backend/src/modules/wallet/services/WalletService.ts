import { WalletRepository }           from '../repositories/WalletRepository.js';
import { AppError }                   from '../../../core/errors/AppError.js';
import { WalletStatus, type Wallet, type WalletBalance } from '../types/wallet.types.js';

export const WalletService = {
  async getOrCreate(ownerId: string): Promise<Wallet> {
    const existing = await WalletRepository.findByOwner(ownerId);
    if (existing) return existing;
    return WalletRepository.createWallet(ownerId);
  },

  async getWallet(ownerId: string): Promise<Wallet> {
    const wallet = await WalletRepository.findByOwner(ownerId);
    if (!wallet) throw new AppError('Wallet not found', 404, 'NOT_FOUND');
    return wallet;
  },

  async requireActiveWallet(ownerId: string): Promise<Wallet> {
    const wallet = await WalletRepository.findByOwner(ownerId);
    if (!wallet) throw new AppError('Wallet not found', 404, 'NOT_FOUND');
    if (wallet.status === WalletStatus.Suspended) throw new AppError('Wallet is suspended', 403, 'WALLET_SUSPENDED');
    if (wallet.status === WalletStatus.Frozen)    throw new AppError('Wallet is frozen', 403, 'WALLET_FROZEN');
    if (wallet.status === WalletStatus.Closed)    throw new AppError('Wallet is closed', 403, 'WALLET_CLOSED');
    return wallet;
  },

  async getBalances(ownerId: string): Promise<WalletBalance[]> {
    const wallet = await WalletService.getWallet(ownerId);
    return WalletRepository.getBalances(wallet.id);
  },

  async getBalance(ownerId: string, currency: string): Promise<WalletBalance | null> {
    const wallet = await WalletService.getWallet(ownerId);
    return WalletRepository.getBalance(wallet.id, currency);
  },

  async suspend(ownerId: string): Promise<Wallet> {
    const wallet = await WalletService.getWallet(ownerId);
    return WalletRepository.updateStatus(wallet.id, WalletStatus.Suspended);
  },

  async freeze(ownerId: string): Promise<Wallet> {
    const wallet = await WalletService.getWallet(ownerId);
    return WalletRepository.updateStatus(wallet.id, WalletStatus.Frozen);
  },

  async reactivate(ownerId: string): Promise<Wallet> {
    const wallet = await WalletService.getWallet(ownerId);
    return WalletRepository.updateStatus(wallet.id, WalletStatus.Active);
  },

  // Compute fee for a given tx type and amount
  async computeFee(txType: string, amount: number): Promise<number> {
    const config = await WalletRepository.getFeeConfig(txType);
    if (!config || !config.isActive) return 0;
    let fee = 0;
    if (config.feeType === 'percent') {
      fee = Math.floor(amount * config.feeValue / 10000);
    } else {
      fee = config.feeValue;
    }
    if (config.minFee && fee < config.minFee) fee = config.minFee;
    if (config.maxFee && fee > config.maxFee) fee = config.maxFee;
    return fee;
  },

  // Check limits before a transaction
  async checkLimits(wallet: Wallet, amount: number, currency: string): Promise<void> {
    const limits = await WalletRepository.getLimitConfig(wallet.kycLevel ?? 0);
    if (!limits) return;
    if (amount > limits.maxSingleTx)
      throw new AppError(`Amount exceeds single transaction limit (${limits.maxSingleTx} ${currency})`, 400, 'LIMIT_EXCEEDED');
    if ((wallet.dailySpent ?? 0) + amount > limits.maxDailyVolume)
      throw new AppError('Daily volume limit exceeded', 400, 'DAILY_LIMIT_EXCEEDED');
    if ((wallet.monthlySpent ?? 0) + amount > limits.maxMonthlyVolume)
      throw new AppError('Monthly volume limit exceeded', 400, 'MONTHLY_LIMIT_EXCEEDED');
  },
};
