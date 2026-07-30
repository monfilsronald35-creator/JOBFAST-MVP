import type { Request, Response, NextFunction } from 'express';
import { FinancialRepository }                  from '../repositories/FinancialRepository.js';
import { RiskEngine }                           from '../services/RiskEngine.js';
import { WalletRepository }                     from '../repositories/WalletRepository.js';

export const RiskController = {
  async listFlags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const walletId = req.query['walletId'] as string | undefined;
      if (!walletId) { res.status(400).json({ success: false, error: 'walletId required' }); return; }
      const flags = await FinancialRepository.listFraudFlags(walletId);
      res.json({ success: true, data: flags });
    } catch (err) { next(err); }
  },

  async scoreWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body     = req.body as Record<string, unknown>;
      const ownerId  = String(body['ownerId']  ?? '');
      const amount   = Number(body['amount']   ?? 0);
      const currency = String(body['currency'] ?? '');
      const wallet   = await WalletRepository.findByOwner(ownerId);
      if (!wallet) { res.status(404).json({ success: false, error: 'Wallet not found' }); return; }
      const result = await RiskEngine.score({ walletId: wallet.id, amount, currency });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async flagManual(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body        = req.body as Record<string, unknown>;
      const ownerId     = String(body['ownerId']      ?? '');
      const type        = String(body['type']         ?? '');
      const description = String(body['description']  ?? '');
      const metadata    = (body['metadata'] as Record<string, unknown> | undefined) ?? {};
      const wallet      = await WalletRepository.findByOwner(ownerId);
      if (!wallet) { res.status(404).json({ success: false, error: 'Wallet not found' }); return; }
      await RiskEngine.flagFraud(wallet.id, ownerId, type, description, metadata);
      res.json({ success: true });
    } catch (err) { next(err); }
  },
};
