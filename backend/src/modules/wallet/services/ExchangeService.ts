import { FinancialRepository } from '../repositories/FinancialRepository.js';
import { WalletRepository }    from '../repositories/WalletRepository.js';
import { WalletService }       from './WalletService.js';
import { AppError }            from '../../../core/errors/AppError.js';
import { TransactionType }     from '../types/wallet.types.js';

// Hardcoded rates relative to HTG — production would fetch from forex API
const BASE_RATES_TO_HTG: Record<string, number> = {
  USD: 13200, EUR: 14500, DOP: 24,   GBP: 16800,
  CAD: 9800,  BRL: 265,   JPY: 90,   HTG: 100,
};

function getRate(from: string, to: string): number | null {
  const fromRate = BASE_RATES_TO_HTG[from];
  const toRate   = BASE_RATES_TO_HTG[to];
  if (!fromRate || !toRate) return null;
  return fromRate / toRate;
}

export const ExchangeService = {
  async getQuote(fromCurrency: string, toCurrency: string, amount: number): Promise<{
    fromAmount: number; toAmount: number; rate: number; fee: number; feeCurrency: string;
  }> {
    const rate = getRate(fromCurrency, toCurrency);
    if (!rate) throw new AppError(`Unsupported currency pair: ${fromCurrency}/${toCurrency}`, 400, 'UNSUPPORTED_PAIR');
    const feeRate    = 0.02; // 2%
    const fee        = Math.floor(amount * feeRate);
    const netAmount  = amount - fee;
    const toAmount   = Math.floor(netAmount * rate);
    return { fromAmount: amount, toAmount, rate, fee, feeCurrency: fromCurrency };
  },

  async convert(ownerId: string, fromCurrency: string, toCurrency: string, fromAmount: number,
    opts: { ip?: string } = {}
  ): Promise<{ success: boolean; toAmount: number }> {
    const wallet = await WalletService.requireActiveWallet(ownerId);
    await WalletService.checkLimits(wallet, fromAmount, fromCurrency);

    const rate = getRate(fromCurrency, toCurrency);
    if (!rate) throw new AppError(`Unsupported currency pair`, 400, 'UNSUPPORTED_PAIR');
    const feeRate = 0.02;
    const fee     = Math.floor(fromAmount * feeRate);
    const netAmt  = fromAmount - fee;
    const toAmt   = Math.floor(netAmt * rate);

    // Debit from-currency
    const debit = await WalletRepository.debit(
      wallet.id, ownerId, fromCurrency, fromAmount,
      TransactionType.Exchange, `Exchange ${fromAmount} ${fromCurrency} → ${toCurrency}`,
      { fee, ip: opts.ip }
    );
    if (!debit.success) return { success: false, toAmount: 0 };

    // Credit to-currency
    await WalletRepository.credit(
      wallet.id, ownerId, toCurrency, toAmt,
      TransactionType.Exchange, `Exchange received ${toAmt} ${toCurrency}`,
    );

    await FinancialRepository.upsertRate(fromCurrency, toCurrency, rate, feeRate);
    await FinancialRepository.recordExchange(wallet.id, ownerId, {
      fromCurrency, toCurrency, fromAmount, toAmount: toAmt, rate, fee,
    });

    return { success: true, toAmount: toAmt };
  },

  async getSupportedCurrencies(): Promise<string[]> {
    return Object.keys(BASE_RATES_TO_HTG);
  },
};
