import { WalletRepository } from '../repositories/WalletRepository.js';
import { WalletService }    from './WalletService.js';
import { RiskEngine }       from './RiskEngine.js';
import { AppError }         from '../../../core/errors/AppError.js';
import { TransactionType }  from '../types/wallet.types.js';

export const TransferService = {
  // ——— Wallet → Wallet ————————————————————————————————————————————————————
  async walletToWallet(fromOwnerId: string, toOwnerId: string, currency: string, amount: number,
    description: string, opts: { ip?: string; deviceId?: string; country?: string } = {}
  ): Promise<{ success: boolean; message: string }> {
    const fromWallet = await WalletService.requireActiveWallet(fromOwnerId);
    await WalletService.checkLimits(fromWallet, amount, currency);

    const toWallet = await WalletRepository.findByOwner(toOwnerId);
    if (!toWallet) throw new AppError('Recipient wallet not found', 404, 'NOT_FOUND');

    const fee        = await WalletService.computeFee(TransactionType.Transfer, amount);
    const riskScore  = await RiskEngine.score({ walletId: fromWallet.id, amount, currency, ip: opts.ip, country: opts.country });

    if (riskScore.decision === 'block') throw new AppError('Transaction blocked by risk engine', 403, 'RISK_BLOCKED');

    const result = await WalletRepository.transfer(
      fromWallet.id, fromOwnerId, toWallet.id, toOwnerId,
      currency, amount, fee, description
    );
    return { success: result.success, message: result.message };
  },

  // ——— Deposit (Cash In) ——————————————————————————————————————————————————
  async deposit(ownerId: string, currency: string, amount: number,
    provider: string, reference: string,
    opts: { ip?: string; deviceId?: string; country?: string } = {}
  ): Promise<string> {
    const wallet = await WalletService.requireActiveWallet(ownerId);
    const txId = await WalletRepository.credit(
      wallet.id, ownerId, currency, amount,
      TransactionType.Deposit, `Deposit via ${provider} — ref: ${reference}`,
      { ip: opts.ip, deviceId: opts.deviceId, country: opts.country }
    );
    return txId;
  },

  // ——— Withdrawal (Cash Out) ———————————————————————————————————————————————
  async withdraw(ownerId: string, currency: string, amount: number, destination: string,
    opts: { ip?: string; deviceId?: string; country?: string } = {}
  ): Promise<{ success: boolean; message: string }> {
    const wallet = await WalletService.requireActiveWallet(ownerId);
    await WalletService.checkLimits(wallet, amount, currency);

    const fee       = await WalletService.computeFee(TransactionType.Withdrawal, amount);
    const riskScore = await RiskEngine.score({ walletId: wallet.id, amount, currency, ip: opts.ip, country: opts.country });

    if (riskScore.decision === 'block') throw new AppError('Withdrawal blocked by risk engine', 403, 'RISK_BLOCKED');
    if (riskScore.decision === 'review') {
      // Flag for manual review but allow (configurable policy)
      await import('../repositories/FinancialRepository.js').then(m =>
        m.FinancialRepository.createFraudFlag({
          walletId: wallet.id, ownerId,
          type: 'high_risk_withdrawal', severity: 'medium' as never,
          description: `Withdrawal of ${amount} ${currency} flagged for review`,
          metadata: { amount, destination, riskScore: riskScore.score },
        }).catch(() => undefined)
      );
    }

    const result = await WalletRepository.debit(
      wallet.id, ownerId, currency, amount,
      TransactionType.Withdrawal, `Withdrawal to ${destination}`,
      { fee, ip: opts.ip, deviceId: opts.deviceId, country: opts.country }
    );
    return { success: result.success, message: result.message };
  },

  // ——— Payment (buyer pays for order/job) ——————————————————————————————————
  async pay(buyerId: string, sellerId: string, currency: string, amount: number,
    description: string,
    opts: { ip?: string; deviceId?: string; country?: string } = {}
  ): Promise<{ success: boolean; message: string }> {
    const buyerWallet = await WalletService.requireActiveWallet(buyerId);
    const sellerWallet = await WalletRepository.findByOwner(sellerId);
    if (!sellerWallet) throw new AppError('Seller wallet not found', 404, 'NOT_FOUND');
    await WalletService.checkLimits(buyerWallet, amount, currency);

    const fee = await WalletService.computeFee(TransactionType.Payment, amount);
    return WalletRepository.transfer(
      buyerWallet.id, buyerId, sellerWallet.id, sellerId,
      currency, amount, fee, description,
    ).then(r => ({ success: r.success, message: r.message }));
  },
};
