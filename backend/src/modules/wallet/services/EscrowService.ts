import { FinancialRepository }      from '../repositories/FinancialRepository.js';
import { WalletRepository }         from '../repositories/WalletRepository.js';
import { WalletService }            from './WalletService.js';
import { AppError }                 from '../../../core/errors/AppError.js';
import { EscrowStatus, type Escrow } from '../types/financial.types.js';

export const EscrowService = {
  async lock(payerId: string, payeeId: string, currency: string, amount: number,
    opts: { orderId?: string; jobId?: string; expiresAt?: string; notes?: string } = {}
  ): Promise<{ escrowId: string; success: boolean; message: string }> {
    const payerWallet = await WalletService.requireActiveWallet(payerId);
    await WalletService.checkLimits(payerWallet, amount, currency);
    const reference = `ESC-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const result = await FinancialRepository.lockEscrow(payerWallet.id, payerId, payeeId, currency, amount, reference, opts);
    return { escrowId: result.escrowId, success: result.success, message: result.message };
  },

  async release(escrowId: string, requesterId: string): Promise<{ success: boolean; message: string }> {
    const escrow = await FinancialRepository.findEscrow(escrowId);
    if (!escrow) throw new AppError('Escrow not found', 404, 'NOT_FOUND');
    if (escrow.payerId !== requesterId && escrow.payeeId !== requesterId)
      throw new AppError('Not authorized to release this escrow', 403, 'FORBIDDEN');
    return FinancialRepository.releaseEscrow(escrowId);
  },

  async refund(escrowId: string, requesterId: string): Promise<{ success: boolean; message: string }> {
    const escrow = await FinancialRepository.findEscrow(escrowId);
    if (!escrow) throw new AppError('Escrow not found', 404, 'NOT_FOUND');
    if (escrow.payerId !== requesterId) throw new AppError('Only payer can request refund', 403, 'FORBIDDEN');
    return FinancialRepository.refundEscrow(escrowId);
  },

  async dispute(escrowId: string): Promise<Escrow> {
    const escrow = await FinancialRepository.findEscrow(escrowId);
    if (!escrow) throw new AppError('Escrow not found', 404, 'NOT_FOUND');
    return FinancialRepository.updateEscrowStatus(escrowId, EscrowStatus.Disputed);
  },

  async listByPayer(payerId: string): Promise<Escrow[]> {
    return FinancialRepository.listEscrowsByPayer(payerId);
  },

  async getById(id: string): Promise<Escrow> {
    const escrow = await FinancialRepository.findEscrow(id);
    if (!escrow) throw new AppError('Escrow not found', 404, 'NOT_FOUND');
    return escrow;
  },
};
