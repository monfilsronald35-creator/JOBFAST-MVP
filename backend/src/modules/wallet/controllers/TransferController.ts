import type { Request, Response, NextFunction } from 'express';
import { TransferService }                      from '../services/TransferService.js';
import { ExchangeService }                      from '../services/ExchangeService.js';

function meta(req: Request): { ip?: string; country?: string; deviceId?: string } {
  const m: { ip?: string; country?: string; deviceId?: string } = {};
  const r = m as unknown as Record<string, unknown>;
  if (req.ip)                       r['ip']       = req.ip;
  if (req.headers['x-country'])     r['country']  = String(req.headers['x-country']);
  if (req.headers['x-device-id'])   r['deviceId'] = String(req.headers['x-device-id']);
  return m;
}

export const TransferController = {
  async deposit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body      = req.body as Record<string, unknown>;
      const currency  = String(body['currency']  ?? '');
      const amount    = Number(body['amount']    ?? 0);
      const provider  = String(body['provider']  ?? '');
      const reference = String(body['reference'] ?? '');
      const txId = await TransferService.deposit(req.user!.sub, currency, amount, provider, reference, meta(req));
      res.status(201).json({ success: true, data: { txId } });
    } catch (err) { next(err); }
  },

  async withdraw(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body        = req.body as Record<string, unknown>;
      const currency    = String(body['currency']    ?? '');
      const amount      = Number(body['amount']      ?? 0);
      const destination = String(body['destination'] ?? '');
      const result = await TransferService.withdraw(req.user!.sub, currency, amount, destination, meta(req));
      res.json({ success: result.success, data: result });
    } catch (err) { next(err); }
  },

  async transfer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body        = req.body as Record<string, unknown>;
      const toOwnerId   = String(body['toOwnerId']   ?? '');
      const currency    = String(body['currency']    ?? '');
      const amount      = Number(body['amount']      ?? 0);
      const description = String(body['description'] ?? '');
      const result = await TransferService.walletToWallet(req.user!.sub, toOwnerId, currency, amount, description, meta(req));
      res.json({ success: result.success, data: result });
    } catch (err) { next(err); }
  },

  async pay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body        = req.body as Record<string, unknown>;
      const sellerId    = String(body['sellerId']    ?? '');
      const currency    = String(body['currency']    ?? '');
      const amount      = Number(body['amount']      ?? 0);
      const description = String(body['description'] ?? '');
      const result = await TransferService.pay(req.user!.sub, sellerId, currency, amount, description, meta(req));
      res.json({ success: result.success, data: result });
    } catch (err) { next(err); }
  },

  async getQuote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const from   = req.query['from']   as string | undefined;
      const to     = req.query['to']     as string | undefined;
      const amount = req.query['amount'] as string | undefined;
      if (!from || !to || !amount) { res.status(400).json({ success: false, error: 'from, to, amount required' }); return; }
      const quote = await ExchangeService.getQuote(from, to, Number(amount));
      res.json({ success: true, data: quote });
    } catch (err) { next(err); }
  },

  async exchange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body         = req.body as Record<string, unknown>;
      const fromCurrency = String(body['fromCurrency'] ?? '');
      const toCurrency   = String(body['toCurrency']   ?? '');
      const amount       = Number(body['amount']        ?? 0);
      const result = await ExchangeService.convert(req.user!.sub, fromCurrency, toCurrency, amount, meta(req));
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
};
