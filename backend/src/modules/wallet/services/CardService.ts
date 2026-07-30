import { FinancialRepository }          from '../repositories/FinancialRepository.js';
import { WalletRepository }            from '../repositories/WalletRepository.js';
import { WalletService }               from './WalletService.js';
import { AppError }                    from '../../../core/errors/AppError.js';
import { CardStatus, type VirtualCard } from '../types/financial.types.js';

export const CardService = {
  async issue(ownerId: string, opts: { currency?: string; spendLimit?: number; isDisposable?: boolean; nickname?: string } = {}): Promise<VirtualCard> {
    const wallet = await WalletService.requireActiveWallet(ownerId);
    return FinancialRepository.createCard(wallet.id, ownerId, {
      status:       CardStatus.Active,
      currency:     opts.currency     ?? 'HTG',
      spendLimit:   opts.spendLimit   ?? 0,
      isDisposable: opts.isDisposable ?? false,
      ...(opts.nickname ? { nickname: opts.nickname } : {}),
    });
  },

  async block(id: string, ownerId: string): Promise<VirtualCard> {
    const cards = await FinancialRepository.listCards(
      (await WalletRepository.findByOwner(ownerId))?.id ?? ''
    );
    if (!cards.find(c => c.id === id)) throw new AppError('Card not found', 404, 'NOT_FOUND');
    return FinancialRepository.updateCard(id, { status: CardStatus.Blocked });
  },

  async unblock(id: string, ownerId: string): Promise<VirtualCard> {
    const cards = await FinancialRepository.listCards(
      (await WalletRepository.findByOwner(ownerId))?.id ?? ''
    );
    if (!cards.find(c => c.id === id)) throw new AppError('Card not found', 404, 'NOT_FOUND');
    return FinancialRepository.updateCard(id, { status: CardStatus.Active });
  },

  async setLimit(id: string, ownerId: string, spendLimit: number): Promise<VirtualCard> {
    const cards = await FinancialRepository.listCards(
      (await WalletRepository.findByOwner(ownerId))?.id ?? ''
    );
    if (!cards.find(c => c.id === id)) throw new AppError('Card not found', 404, 'NOT_FOUND');
    return FinancialRepository.updateCard(id, { spendLimit });
  },

  async list(ownerId: string): Promise<VirtualCard[]> {
    const wallet = await WalletService.getWallet(ownerId);
    return FinancialRepository.listCards(wallet.id);
  },
};
