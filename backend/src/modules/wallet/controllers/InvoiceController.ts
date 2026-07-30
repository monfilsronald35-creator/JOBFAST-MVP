import type { Request, Response, NextFunction } from 'express';
import { InvoiceService }                       from '../services/InvoiceService.js';

export const InvoiceController = {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body        = req.body as Record<string, unknown>;
      const recipientId = String(body['recipientId'] ?? '');
      const currency    = String(body['currency']    ?? '');
      const items       = (body['items'] as Array<{ description: string; quantity: number; unitPrice: number; taxRate?: number }>) ?? [];
      const data: Parameters<typeof InvoiceService.create>[1] = { recipientId, currency, items };
      const d = data as unknown as Record<string, unknown>;
      if (body['dueDate']) d['dueDate'] = String(body['dueDate']);
      if (body['notes'])   d['notes']   = String(body['notes']);
      const result = await InvoiceService.create(req.user!.sub, data);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoices = await InvoiceService.list(req.user!.sub);
      res.json({ success: true, data: invoices });
    } catch (err) { next(err); }
  },

  async send(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await InvoiceService.send(String(req.params['id']), req.user!.sub);
      res.json({ success: true, data: invoice });
    } catch (err) { next(err); }
  },

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invoice = await InvoiceService.cancel(String(req.params['id']), req.user!.sub);
      res.json({ success: true, data: invoice });
    } catch (err) { next(err); }
  },
};
