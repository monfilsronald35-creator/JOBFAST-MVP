import type { Request, Response, NextFunction } from 'express';
import { WalletService }                        from '../services/WalletService.js';
import { TransactionService }                   from '../services/TransactionService.js';
import { type TransactionFilter }               from '../types/wallet.types.js';

export const WalletController = {
  async getOrCreate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const wallet = await WalletService.getOrCreate(req.user!.sub);
      res.json({ success: true, data: wallet });
    } catch (err) { next(err); }
  },

  async getBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const balances = await WalletService.getBalances(req.user!.sub);
      res.json({ success: true, data: balances });
    } catch (err) { next(err); }
  },

  async getBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currency = String(req.params['currency'] ?? '');
      const balance  = await WalletService.getBalance(req.user!.sub, currency);
      res.json({ success: true, data: balance });
    } catch (err) { next(err); }
  },

  async listTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filter: TransactionFilter = {};
      const f = filter as unknown as Record<string, unknown>;
      if (req.query['type'])      f['type']      = String(req.query['type']);
      if (req.query['direction']) f['direction'] = String(req.query['direction']);
      if (req.query['status'])    f['status']    = String(req.query['status']);
      if (req.query['currency'])  f['currency']  = String(req.query['currency']);
      if (req.query['dateFrom'])  f['dateFrom']  = String(req.query['dateFrom']);
      if (req.query['dateTo'])    f['dateTo']    = String(req.query['dateTo']);
      if (req.query['cursor'])    f['cursor']    = String(req.query['cursor']);
      if (req.query['limit'])     f['limit']     = Number(req.query['limit']);
      const result = await TransactionService.list(req.user!.sub, filter);
      res.json({ success: true, data: result.data, meta: { nextCursor: result.nextCursor } });
    } catch (err) { next(err); }
  },

  async getStatement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const fromDate = req.query['fromDate'] as string | undefined;
      const toDate   = req.query['toDate']   as string | undefined;
      const currency = req.query['currency'] as string | undefined;
      if (!fromDate || !toDate) { res.status(400).json({ success: false, error: 'fromDate and toDate required' }); return; }
      const statement = await TransactionService.getStatement(req.user!.sub, fromDate, toDate, currency);
      res.json({ success: true, data: statement });
    } catch (err) { next(err); }
  },
};
