import type { Request, Response, NextFunction } from 'express';
import { OperatorService }          from '../services/OperatorService.js';
import { RechargeEngine }           from '../services/RechargeEngine.js';
import { BundleEngine }             from '../services/BundleEngine.js';
import { SIMService }               from '../services/SIMService.js';
import { BillingService }           from '../services/BillingService.js';
import { DealerService }            from '../services/DealerService.js';
import { CommissionEngine }         from '../services/CommissionEngine.js';
import { FraudService }             from '../services/FraudService.js';
import { TelecomAnalyticsService }  from '../services/TelecomAnalyticsService.js';
import { TelecomAIService }         from '../services/TelecomAIService.js';
import type { RechargeType, BundleType, DealerTier } from '../types/telecom.types.js';

function b(req: Request): Record<string, unknown>  { return req.body as Record<string, unknown>; }
function q(req: Request): Record<string, unknown>  { return req.query as Record<string, unknown>; }
function u(req: Request): string                    { return req.user!.sub; }
function p(req: Request, k: string): string         { return String(req.params[k] ?? ''); }

export const TelecomController = {
  // ── Operators ─────────────────────────────────────────────────────────────────
  async registerOperator(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bv = b(req);
      const op = await OperatorService.register(u(req), {
        name:     String(bv['name']     ?? ''),
        code:     String(bv['code']     ?? ''),
        country:  String(bv['country']  ?? 'HT'),
        currency: String(bv['currency'] ?? 'HTG'),
        apiType:  bv['apiType'] as 'rest' | undefined,
        logoUrl:  bv['logoUrl'] ? String(bv['logoUrl']) : undefined,
        website:  bv['website'] ? String(bv['website']) : undefined,
      });
      res.status(201).json({ data: op });
    } catch (err) { next(err); }
  },

  async listOperators(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await OperatorService.listMine(u(req)) }); } catch (err) { next(err); }
  },

  async listAllOperators(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await OperatorService.listAll() }); } catch (err) { next(err); }
  },

  async getOperator(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const op = await OperatorService.get(p(req, 'opId'));
      if (!op) { res.status(404).json({ code: 'NOT_FOUND' }); return; }
      res.json({ data: op });
    } catch (err) { next(err); }
  },

  async getOperatorConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await OperatorService.getConfig(p(req, 'opId')) }); } catch (err) { next(err); }
  },

  async updateOperatorConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await OperatorService.updateConfig(p(req, 'opId'), b(req) as never);
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── Dashboard ─────────────────────────────────────────────────────────────────
  async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await TelecomAnalyticsService.getDashboard(p(req, 'opId')) }); } catch (err) { next(err); }
  },

  // ── Bundles ───────────────────────────────────────────────────────────────────
  async createBundle(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bv = b(req);
      const bundle = await BundleEngine.create(p(req, 'opId'), {
        name:         String(bv['name']         ?? ''),
        code:         String(bv['code']         ?? ''),
        type:         (bv['type'] as BundleType) ?? 'combo',
        description:  String(bv['description']  ?? ''),
        price:        Number(bv['price']         ?? 0),
        currency:     String(bv['currency']      ?? 'HTG'),
        validityDays: Number(bv['validityDays']  ?? 30),
        dataGb:       bv['dataGb']       ? Number(bv['dataGb'])       : undefined,
        minutesMins:  bv['minutesMins']  ? Number(bv['minutesMins'])  : undefined,
        smsCount:     bv['smsCount']     ? Number(bv['smsCount'])     : undefined,
        speed:        bv['speed']        ? String(bv['speed'])        : undefined,
        coverage:     bv['coverage']     ? String(bv['coverage'])     : undefined,
        bonus:        bv['bonus']        ? String(bv['bonus'])        : undefined,
        isRenewable:  Boolean(bv['isRenewable']  ?? true),
        countries:    (bv['countries'] as string[]) ?? [],
        tags:         (bv['tags']     as string[]) ?? [],
      });
      res.status(201).json({ data: bundle });
    } catch (err) { next(err); }
  },

  async listBundles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qp   = q(req);
      const data = await BundleEngine.list(p(req, 'opId'), qp['type'] ? String(qp['type']) : undefined);
      res.json({ data });
    } catch (err) { next(err); }
  },

  async searchBundles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qp = q(req);
      res.json({ data: await BundleEngine.search(p(req, 'opId'), {
        type:     qp['type']     ? String(qp['type'])     : undefined,
        maxPrice: qp['maxPrice'] ? Number(qp['maxPrice']) : undefined,
        minData:  qp['minData']  ? Number(qp['minData'])  : undefined,
        country:  qp['country']  ? String(qp['country'])  : undefined,
      }) });
    } catch (err) { next(err); }
  },

  async recommendBundles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bv  = b(req);
      const recs = await BundleEngine.recommend(p(req, 'opId'), {
        data:    Boolean(bv['data']    ?? true),
        calls:   Boolean(bv['calls']   ?? true),
        sms:     Boolean(bv['sms']     ?? false),
        country: bv['country'] ? String(bv['country']) : undefined,
      });
      res.json({ data: recs });
    } catch (err) { next(err); }
  },

  // ── Recharge ──────────────────────────────────────────────────────────────────
  async initiateRecharge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bv = b(req);
      const rc = await RechargeEngine.initiate({
        operatorId:  p(req, 'opId'),
        userId:      u(req),
        phone:       String(bv['phone']    ?? ''),
        amount:      Number(bv['amount']   ?? 0),
        currency:    String(bv['currency'] ?? 'HTG'),
        type:        (bv['type'] as RechargeType) ?? 'prepaid',
        bundleId:    bv['bundleId']    ? String(bv['bundleId'])    : undefined,
        dealerId:    bv['dealerId']    ? String(bv['dealerId'])    : undefined,
        scheduledAt: bv['scheduledAt'] ? String(bv['scheduledAt']) : undefined,
      });
      res.status(201).json({ data: rc });
    } catch (err) {
      if (err instanceof Error && err.message === 'FRAUD_BLOCKED') {
        res.status(403).json({ code: 'FRAUD_BLOCKED', message: 'Transaction bloke pou rezon sekirite' });
        return;
      }
      next(err);
    }
  },

  async listRecharges(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qp = q(req);
      res.json({ data: await RechargeEngine.list({
        operatorId: p(req, 'opId'),
        userId:     qp['userId']  ? String(qp['userId'])  : undefined,
        dealerId:   qp['dealerId']? String(qp['dealerId']): undefined,
        status:     qp['status']  ? String(qp['status'])  : undefined,
        limit:      qp['limit']   ? Number(qp['limit'])   : 50,
      }) });
    } catch (err) { next(err); }
  },

  async refundRecharge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await RechargeEngine.refund(p(req, 'rechargeId'), u(req));
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async cancelRecharge(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await RechargeEngine.cancel(p(req, 'rechargeId'));
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async processRetries(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      void RechargeEngine.processRetries(p(req, 'opId'));
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── SIM Management ────────────────────────────────────────────────────────────
  async registerSIM(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bv  = b(req);
      const sim = await SIMService.register(p(req, 'opId'), u(req), {
        iccid:   String(bv['iccid']   ?? ''),
        msisdn:  String(bv['msisdn']  ?? ''),
        type:    (bv['type'] as 'physical' | 'esim') ?? 'physical',
        country: String(bv['country'] ?? 'HT'),
      });
      res.status(201).json({ data: sim });
    } catch (err) { next(err); }
  },

  async listSIMs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await SIMService.listMine(u(req)) }); } catch (err) { next(err); }
  },

  async verifyKYC(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bv = b(req);
      await SIMService.verifyKYC(p(req, 'simId'), Boolean(bv['approved'] ?? false));
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async replaceSIM(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bv  = b(req);
      const sim = await SIMService.replace(String(bv['oldIccid'] ?? ''), String(bv['newIccid'] ?? ''), u(req), p(req, 'opId'));
      res.json({ data: sim });
    } catch (err) { next(err); }
  },

  // ── Billing ───────────────────────────────────────────────────────────────────
  async createBill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bv   = b(req);
      const bill = await BillingService.createBill(p(req, 'opId'), {
        userId:   u(req),
        phone:    String(bv['phone']    ?? ''),
        period:   String(bv['period']   ?? ''),
        currency: String(bv['currency'] ?? 'HTG'),
        dueDate:  String(bv['dueDate']  ?? ''),
        items:    (bv['items'] as never) ?? [],
      });
      res.status(201).json({ data: bill });
    } catch (err) { next(err); }
  },

  async listBills(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ data: await BillingService.listBills(u(req), p(req, 'opId')) });
    } catch (err) { next(err); }
  },

  async payBill(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { await BillingService.pay(p(req, 'billId')); res.json({ success: true }); } catch (err) { next(err); }
  },

  // ── Dealers ───────────────────────────────────────────────────────────────────
  async registerDealer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bv = b(req);
      const d  = await DealerService.register(p(req, 'opId'), {
        userId:    u(req),
        name:      String(bv['name']     ?? ''),
        tier:      (bv['tier'] as DealerTier) ?? 'agent',
        country:   String(bv['country']  ?? 'HT'),
        city:      String(bv['city']     ?? ''),
        phone:     String(bv['phone']    ?? ''),
        email:     bv['email']     ? String(bv['email'])     : undefined,
        managerId: bv['managerId'] ? String(bv['managerId']) : undefined,
        currency:  bv['currency']  ? String(bv['currency'])  : undefined,
      });
      res.status(201).json({ data: d });
    } catch (err) { next(err); }
  },

  async listDealers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await DealerService.list(p(req, 'opId')) }); } catch (err) { next(err); }
  },

  async getDealerPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { res.json({ data: await DealerService.getPerformance(p(req, 'dealerId')) }); } catch (err) { next(err); }
  },

  async topUpDealer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bv = b(req);
      await DealerService.topUp(p(req, 'dealerId'), Number(bv['amount'] ?? 0));
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  // ── Commissions ───────────────────────────────────────────────────────────────
  async listCommissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qp = q(req);
      res.json({ data: await CommissionEngine.list(p(req, 'dealerId'), qp['status'] ? String(qp['status']) : undefined) });
    } catch (err) { next(err); }
  },

  async payoutCommissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const total = await CommissionEngine.payout(p(req, 'opId'), p(req, 'dealerId'));
      res.json({ success: true, data: { total } });
    } catch (err) { next(err); }
  },

  // ── Fraud ─────────────────────────────────────────────────────────────────────
  async listFraudEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qp = q(req);
      res.json({ data: await FraudService.listEvents(p(req, 'opId'), qp['limit'] ? Number(qp['limit']) : 50) });
    } catch (err) { next(err); }
  },

  // ── Analytics ─────────────────────────────────────────────────────────────────
  async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qp     = q(req);
      const period = qp['period'] ? String(qp['period']) : new Date().toISOString().slice(0, 7);
      res.json({ data: await TelecomAnalyticsService.generate(p(req, 'opId'), period) });
    } catch (err) { next(err); }
  },

  // ── AI ────────────────────────────────────────────────────────────────────────
  async getAIInsights(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const qp   = q(req);
      const lang = qp['lang'] ? String(qp['lang']) : 'ht';
      res.json({ data: await TelecomAIService.getInsights(p(req, 'opId'), lang) });
    } catch (err) { next(err); }
  },

  async getAIRecommendations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ data: await TelecomAIService.recommendBundles(p(req, 'opId'), u(req)) });
    } catch (err) { next(err); }
  },

  async detectAnomalies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.json({ data: await TelecomAIService.detectAnomalies(p(req, 'opId')) });
    } catch (err) { next(err); }
  },
};