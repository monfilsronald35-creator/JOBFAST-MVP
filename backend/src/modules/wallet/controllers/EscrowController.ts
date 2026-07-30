import type { Request, Response, NextFunction } from 'express';
import { EscrowService }                        from '../services/EscrowService.js';

export const EscrowController = {
  async lock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body    = req.body as Record<string, unknown>;
      const payeeId  = String(body['payeeId']  ?? '');
      const currency = String(body['currency'] ?? '');
      const amount   = Number(body['amount']   ?? 0);
      const opts: { orderId?: string; jobId?: string; expiresAt?: string; notes?: string } = {};
      const o = opts as unknown as Record<string, unknown>;
      if (body['orderId'])   o['orderId']   = String(body['orderId']);
      if (body['jobId'])     o['jobId']     = String(body['jobId']);
      if (body['expiresAt']) o['expiresAt'] = String(body['expiresAt']);
      if (body['notes'])     o['notes']     = String(body['notes']);
      const result = await EscrowService.lock(req.user!.sub, payeeId, currency, amount, opts);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async release(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EscrowService.release(String(req.params['id']), req.user!.sub);
      res.json({ success: result.success, data: result });
    } catch (err) { next(err); }
  },

  async refund(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await EscrowService.refund(String(req.params['id']), req.user!.sub);
      res.json({ success: result.success, data: result });
    } catch (err) { next(err); }
  },

  async dispute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const escrow = await EscrowService.dispute(String(req.params['id']));
      res.json({ success: true, data: escrow });
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const escrows = await EscrowService.listByPayer(req.user!.sub);
      res.json({ success: true, data: escrows });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const escrow = await EscrowService.getById(String(req.params['id']));
      res.json({ success: true, data: escrow });
    } catch (err) { next(err); }
  },
};
