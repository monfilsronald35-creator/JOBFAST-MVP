import type { Request, Response } from 'express';
import { MonetizationConfigService } from '../services/MonetizationConfigService.js';
import { RevenueEngine }              from '../services/RevenueEngine.js';
import { FreeTierEngine }             from '../services/FreeTierEngine.js';
import { BillingEngine }              from '../services/BillingEngine.js';
import { RevenueAnalyticsService }    from '../services/RevenueAnalyticsService.js';
import { MonetizationAnnouncementService } from '../services/MonetizationAnnouncementService.js';
import type {
  MonetizationService,
  FreeTierStrategyType,
} from '../types/monetization.types.js';

export const MonetizationController = {

  // ── Public ─────────────────────────────────────────────────────────────────

  async calculateFeePreview(req: Request, res: Response): Promise<void> {
    const service  = String(req.query['service'] ?? '') as MonetizationService;
    const amount   = parseInt(String(req.query['amount']   ?? '0'), 10);
    const currency = String(req.query['currency'] ?? 'HTG');
    const country  = req.query['country']  ? String(req.query['country'])  : undefined;
    const city     = req.query['city']     ? String(req.query['city'])     : undefined;
    const userType = req.query['userType'] ? String(req.query['userType']) : undefined;
    const userId   = req.query['userId']   ? String(req.query['userId'])   : undefined;

    if (!service || isNaN(amount)) {
      res.status(400).json({ code: 'INVALID_PARAMS', message: 'service ak amount obligatwa' });
      return;
    }
    const calc = await RevenueEngine.calculateFee({ service, amount, currency, country, city, userType, userId });
    res.json({ ok: true, data: calc });
  },

  // ── Authenticated ──────────────────────────────────────────────────────────

  async getStatus(req: Request, res: Response): Promise<void> {
    const [config, services] = await Promise.all([
      MonetizationConfigService.getConfig(),
      MonetizationConfigService.getServiceConfigs(),
    ]);
    res.json({ ok: true, data: { globalEnabled: config.globalEnabled, services } });
  },

  async getMyInvoices(req: Request, res: Response): Promise<void> {
    const userId = String(req.user?.['id'] ?? '');
    const limit  = Math.min(parseInt(String(req.query['limit'] ?? '20'), 10), 50);
    const cursor = req.query['cursor'] ? String(req.query['cursor']) : undefined;
    const result = await BillingEngine.getUserInvoices(userId, limit, cursor);
    res.json({ ok: true, data: result });
  },

  async getInvoice(req: Request, res: Response): Promise<void> {
    const id      = String(req.params['id'] ?? '');
    const invoice = await BillingEngine.getInvoice(id);
    if (!invoice) { res.status(404).json({ code: 'NOT_FOUND' }); return; }
    const role = req.user?.['role'] as string | undefined;
    if (invoice.userId !== req.user?.['id'] && role !== 'admin' && role !== 'superadmin') {
      res.status(403).json({ code: 'FORBIDDEN' }); return;
    }
    res.json({ ok: true, data: invoice });
  },

  async markModalSeen(req: Request, res: Response): Promise<void> {
    const userId = String(req.user?.['id'] ?? '');
    await MonetizationAnnouncementService.markModalSeen(userId);
    res.json({ ok: true });
  },

  async getModalStatus(req: Request, res: Response): Promise<void> {
    const userId = String(req.user?.['id'] ?? '');
    const seen   = await MonetizationAnnouncementService.hasSeenModal(userId);
    res.json({ ok: true, data: { seen } });
  },

  async checkFreeTier(req: Request, res: Response): Promise<void> {
    const userId   = String(req.user?.['id'] ?? '');
    const service  = String(req.query['service'] ?? '') as MonetizationService;
    const userType = req.query['userType'] ? String(req.query['userType']) : undefined;
    const result   = await FreeTierEngine.isInFreeTier(userId, service, userType);
    res.json({ ok: true, data: result });
  },

  // ── Admin ──────────────────────────────────────────────────────────────────

  async getFullConfig(req: Request, res: Response): Promise<void> {
    const [config, services, rules, strategies] = await Promise.all([
      MonetizationConfigService.getConfig(),
      MonetizationConfigService.getServiceConfigs(),
      MonetizationConfigService.getAllFeeRules(),
      FreeTierEngine.getAllStrategies(),
    ]);
    res.json({ ok: true, data: { config, services, rules, strategies } });
  },

  async setGlobalEnabled(req: Request, res: Response): Promise<void> {
    const actorId = String(req.user?.['id'] ?? '');
    const body    = req.body as Record<string, unknown>;
    if (typeof body['enabled'] !== 'boolean') {
      res.status(400).json({ code: 'INVALID_PARAMS', message: 'enabled (boolean) obligatwa' });
      return;
    }
    await MonetizationConfigService.setGlobalEnabled(actorId, body['enabled'] as boolean);
    res.json({ ok: true, data: { globalEnabled: body['enabled'] } });
  },

  async setServiceEnabled(req: Request, res: Response): Promise<void> {
    const actorId = String(req.user?.['id'] ?? '');
    const service = String(req.params['service'] ?? '') as MonetizationService;
    const body    = req.body as Record<string, unknown>;
    if (typeof body['enabled'] !== 'boolean') {
      res.status(400).json({ code: 'INVALID_PARAMS', message: 'enabled (boolean) obligatwa' });
      return;
    }
    await MonetizationConfigService.setServiceEnabled(actorId, service, body['enabled'] as boolean);
    res.json({ ok: true, data: { service, enabled: body['enabled'] } });
  },

  async listFeeRules(req: Request, res: Response): Promise<void> {
    const rules = await MonetizationConfigService.getAllFeeRules();
    res.json({ ok: true, data: rules });
  },

  async upsertFeeRule(req: Request, res: Response): Promise<void> {
    const actorId = String(req.user?.['id'] ?? '');
    const body    = req.body as Record<string, unknown>;
    const rule    = await MonetizationConfigService.upsertFeeRule(actorId, {
      id:          body['id']          as string | undefined,
      service:     body['service']     as MonetizationService,
      country:     body['country']     as string | undefined,
      city:        body['city']        as string | undefined,
      userType:    body['userType']    as string | undefined,
      volumeMin:   body['volumeMin']   as number | undefined,
      volumeMax:   body['volumeMax']   as number | undefined,
      ratePercent: body['ratePercent'] as number | undefined,
      fixedAmount: body['fixedAmount'] as number | undefined,
      currency:    body['currency']    as string | undefined,
      priority:   (body['priority']   as number) ?? 0,
      active:     (body['active']     as boolean) ?? true,
      label:       body['label']       as string | undefined,
    });
    res.json({ ok: true, data: rule });
  },

  async deleteFeeRule(req: Request, res: Response): Promise<void> {
    const id = String(req.params['id'] ?? '');
    await MonetizationConfigService.deleteFeeRule(id);
    res.json({ ok: true });
  },

  async listStrategies(req: Request, res: Response): Promise<void> {
    const strategies = await FreeTierEngine.getAllStrategies();
    res.json({ ok: true, data: strategies });
  },

  async upsertStrategy(req: Request, res: Response): Promise<void> {
    const actorId  = String(req.user?.['id'] ?? '');
    const body     = req.body as Record<string, unknown>;
    const strategy = await FreeTierEngine.upsertStrategy(actorId, {
      id:           body['id']           as string | undefined,
      name:         body['name']         as string,
      strategyType: body['strategyType'] as FreeTierStrategyType,
      value:        body['value']        as number | undefined,
      currency:     body['currency']     as string | undefined,
      userTypes:    body['userTypes']    as string[] | undefined,
      service:      body['service']      as string | undefined,
      active:      (body['active']       as boolean) ?? true,
    });
    res.json({ ok: true, data: strategy });
  },

  async deleteStrategy(req: Request, res: Response): Promise<void> {
    const id = String(req.params['id'] ?? '');
    await FreeTierEngine.deleteStrategy(id);
    res.json({ ok: true });
  },

  async getDashboard(req: Request, res: Response): Promise<void> {
    const dashboard = await RevenueAnalyticsService.getDashboard();
    res.json({ ok: true, data: dashboard });
  },

  async getAIInsights(req: Request, res: Response): Promise<void> {
    const insights = await RevenueAnalyticsService.getAIInsights();
    res.json({ ok: true, data: insights });
  },

  async announce(req: Request, res: Response): Promise<void> {
    const actorId = String(req.user?.['id'] ?? '');
    const body    = req.body as Record<string, unknown>;
    const result  = await MonetizationAnnouncementService.announce(actorId, {
      type:     body['type']     as 'monetization_enabled' | 'fee_change' | 'new_service',
      title:    body['title']    as string,
      body:     body['body']     as string,
      services: body['services'] as string[] | undefined,
      metadata: body['metadata'] as Record<string, unknown> | undefined,
    });
    res.json({ ok: true, data: result });
  },

  async listAnnouncements(req: Request, res: Response): Promise<void> {
    const limit = Math.min(parseInt(String(req.query['limit'] ?? '20'), 10), 50);
    const list  = await MonetizationAnnouncementService.listAnnouncements(limit);
    res.json({ ok: true, data: list });
  },

  async getCommissionReport(req: Request, res: Response): Promise<void> {
    const defaultFrom = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const from    = new Date(String(req.query['from'] ?? defaultFrom));
    const to      = new Date(String(req.query['to']   ?? new Date().toISOString()));
    const service = req.query['service'] ? String(req.query['service']) : undefined;
    const report  = await BillingEngine.getCommissionReport(from, to, service);
    res.json({ ok: true, data: report });
  },
};