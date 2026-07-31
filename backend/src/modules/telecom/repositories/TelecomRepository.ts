import { db } from '../../../core/database/SupabaseClient.js';
import type {
  TelecomOperator, OperatorConfig, TelecomBundle, TelecomRecharge,
  SIMCard, TelecomBill, TelecomDealer, Commission, CommissionRule, FraudEvent,
} from '../types/telecom.types.js';

export const TelecomRepository = {
  // ── Operators ─────────────────────────────────────────────────────────────────
  async createOperator(op: Omit<TelecomOperator, 'id' | 'createdAt'>): Promise<TelecomOperator> {
    const { data, error } = await db.client().from('tel_operators').insert({
      name: op.name, code: op.code, country: op.country, currency: op.currency,
      logo_url: op.logoUrl, website: op.website, api_type: op.apiType,
      is_active: op.isActive, owner_id: op.ownerId,
    }).select().single();
    if (error) throw error;
    return mapOp(data as Record<string, unknown>);
  },

  async getOperator(id: string): Promise<TelecomOperator | null> {
    const { data } = await db.client().from('tel_operators').select('*').eq('id', id).single();
    return data ? mapOp(data as Record<string, unknown>) : null;
  },

  async getOperatorByCode(code: string): Promise<TelecomOperator | null> {
    const { data } = await db.client().from('tel_operators').select('*').eq('code', code).single();
    return data ? mapOp(data as Record<string, unknown>) : null;
  },

  async listOperators(ownerId?: string): Promise<TelecomOperator[]> {
    let q = db.client().from('tel_operators').select('*').eq('is_active', true);
    if (ownerId) q = q.eq('owner_id', ownerId);
    const { data } = await q.order('name');
    return (data ?? []).map(r => mapOp(r as Record<string, unknown>));
  },

  async upsertConfig(cfg: OperatorConfig): Promise<void> {
    await db.client().from('tel_operator_configs').upsert({
      operator_id:    cfg.operatorId,
      api_base_url:   cfg.apiBaseUrl,
      api_key:        cfg.apiKey,
      api_secret:     cfg.apiSecret,
      webhook_url:    cfg.webhookUrl,
      timeout_ms:     cfg.timeout,
      retry_attempts: cfg.retryAttempts,
      rate_limit_rpm: cfg.rateLimitRpm,
      sandbox_mode:   cfg.sandboxMode,
      updated_at:     new Date().toISOString(),
    }, { onConflict: 'operator_id' });
  },

  async getConfig(operatorId: string): Promise<OperatorConfig | null> {
    const { data } = await db.client().from('tel_operator_configs').select('*').eq('operator_id', operatorId).single();
    if (!data) return null;
    const r = data as Record<string, unknown>;
    const cfg: OperatorConfig = {
      operatorId,
      apiBaseUrl:    String(r['api_base_url'] ?? ''),
      timeout:       Number(r['timeout_ms'] ?? 30000),
      retryAttempts: Number(r['retry_attempts'] ?? 3),
      rateLimitRpm:  Number(r['rate_limit_rpm'] ?? 60),
      sandboxMode:   Boolean(r['sandbox_mode'] ?? true),
      updatedAt:     String(r['updated_at'] ?? ''),
    };
    if (r['api_key'])     cfg.apiKey     = String(r['api_key']);
    if (r['api_secret'])  cfg.apiSecret  = String(r['api_secret']);
    if (r['webhook_url']) cfg.webhookUrl = String(r['webhook_url']);
    return cfg;
  },

  // ── Bundles ───────────────────────────────────────────────────────────────────
  async createBundle(b: Omit<TelecomBundle, 'id' | 'createdAt'>): Promise<TelecomBundle> {
    const row: Record<string, unknown> = {
      operator_id: b.operatorId, name: b.name, code: b.code, type: b.type,
      description: b.description, price: b.price, currency: b.currency,
      validity_days: b.validityDays, is_renewable: b.isRenewable,
      countries: b.countries, tags: b.tags, is_active: b.isActive,
    };
    if (b.dataGb)      row['data_gb']      = b.dataGb;
    if (b.minutesMins) row['minutes_mins'] = b.minutesMins;
    if (b.smsCount)    row['sms_count']    = b.smsCount;
    if (b.speed)       row['speed']        = b.speed;
    if (b.coverage)    row['coverage']     = b.coverage;
    if (b.bonus)       row['bonus']        = b.bonus;
    const { data, error } = await db.client().from('tel_bundles').insert(row).select().single();
    if (error) throw error;
    return mapBundle(data as Record<string, unknown>);
  },

  async listBundles(operatorId: string, type?: string): Promise<TelecomBundle[]> {
    let q = db.client().from('tel_bundles').select('*').eq('operator_id', operatorId).eq('is_active', true);
    if (type) q = q.eq('type', type);
    const { data } = await q.order('price');
    return (data ?? []).map(r => mapBundle(r as Record<string, unknown>));
  },

  async getBundle(id: string): Promise<TelecomBundle | null> {
    const { data } = await db.client().from('tel_bundles').select('*').eq('id', id).single();
    return data ? mapBundle(data as Record<string, unknown>) : null;
  },

  // ── Recharges ─────────────────────────────────────────────────────────────────
  async createRecharge(r: Omit<TelecomRecharge, 'id' | 'createdAt'>): Promise<TelecomRecharge> {
    const row: Record<string, unknown> = {
      operator_id: r.operatorId, user_id: r.userId, type: r.type,
      phone: r.phone, amount: r.amount, currency: r.currency, status: r.status,
    };
    if (r.dealerId)    row['dealer_id']    = r.dealerId;
    if (r.bundleId)    row['bundle_id']    = r.bundleId;
    if (r.scheduledAt) row['scheduled_at'] = r.scheduledAt;
    const { data, error } = await db.client().from('tel_recharges').insert(row).select().single();
    if (error) throw error;
    return mapRecharge(data as Record<string, unknown>);
  },

  async updateRechargeStatus(id: string, status: TelecomRecharge['status'], extra: Record<string, unknown> = {}): Promise<void> {
    const row: Record<string, unknown> = { status, ...extra };
    if (status === 'completed') row['completed_at'] = new Date().toISOString();
    if (status === 'refunded')  row['refunded_at']  = new Date().toISOString();
    await db.client().from('tel_recharges').update(row).eq('id', id);
  },

  async listRecharges(filters: { operatorId?: string; userId?: string; dealerId?: string; status?: string; limit?: number }): Promise<TelecomRecharge[]> {
    let q = db.client().from('tel_recharges').select('*');
    if (filters.operatorId) q = q.eq('operator_id', filters.operatorId);
    if (filters.userId)     q = q.eq('user_id', filters.userId);
    if (filters.dealerId)   q = q.eq('dealer_id', filters.dealerId);
    if (filters.status)     q = q.eq('status', filters.status);
    const { data } = await q.order('created_at', { ascending: false }).limit(filters.limit ?? 50);
    return (data ?? []).map(r => mapRecharge(r as Record<string, unknown>));
  },

  async getRecharge(id: string): Promise<TelecomRecharge | null> {
    const { data } = await db.client().from('tel_recharges').select('*').eq('id', id).single();
    return data ? mapRecharge(data as Record<string, unknown>) : null;
  },

  async countRecentRecharges(phone: string, minutes: number): Promise<number> {
    const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
    const { count } = await db.client()
      .from('tel_recharges').select('*', { count: 'exact', head: true })
      .eq('phone', phone).gte('created_at', since);
    return count ?? 0;
  },

  // ── SIMs ─────────────────────────────────────────────────────────────────────
  async createSIM(s: Omit<SIMCard, 'id' | 'createdAt'>): Promise<SIMCard> {
    const row: Record<string, unknown> = {
      operator_id: s.operatorId, user_id: s.userId, iccid: s.iccid,
      msisdn: s.msisdn, type: s.type, status: s.status, kyc_status: s.kycStatus, country: s.country,
    };
    if (s.activatedAt) row['activated_at'] = s.activatedAt;
    if (s.expiresAt)   row['expires_at']   = s.expiresAt;
    const { data, error } = await db.client().from('tel_sims').insert(row).select().single();
    if (error) throw error;
    return mapSIM(data as Record<string, unknown>);
  },

  async getSIM(iccid: string): Promise<SIMCard | null> {
    const { data } = await db.client().from('tel_sims').select('*').eq('iccid', iccid).single();
    return data ? mapSIM(data as Record<string, unknown>) : null;
  },

  async listSIMs(userId: string): Promise<SIMCard[]> {
    const { data } = await db.client().from('tel_sims').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return (data ?? []).map(r => mapSIM(r as Record<string, unknown>));
  },

  async updateSIMStatus(id: string, status: SIMCard['status'], kycStatus?: SIMCard['kycStatus']): Promise<void> {
    const row: Record<string, unknown> = { status };
    if (kycStatus) row['kyc_status'] = kycStatus;
    if (status === 'active') row['activated_at'] = new Date().toISOString();
    await db.client().from('tel_sims').update(row).eq('id', id);
  },

  // ── Bills ─────────────────────────────────────────────────────────────────────
  async createBill(b: Omit<TelecomBill, 'id' | 'createdAt'>): Promise<TelecomBill> {
    const { data, error } = await db.client().from('tel_bills').insert({
      operator_id: b.operatorId, user_id: b.userId, phone: b.phone, period: b.period,
      amount: b.amount, currency: b.currency, due_date: b.dueDate,
      status: b.status, items: b.items,
    }).select().single();
    if (error) throw error;
    return mapBill(data as Record<string, unknown>);
  },

  async listBills(userId: string, operatorId?: string): Promise<TelecomBill[]> {
    let q = db.client().from('tel_bills').select('*').eq('user_id', userId);
    if (operatorId) q = q.eq('operator_id', operatorId);
    const { data } = await q.order('created_at', { ascending: false });
    return (data ?? []).map(r => mapBill(r as Record<string, unknown>));
  },

  async updateBillStatus(id: string, status: TelecomBill['status']): Promise<void> {
    const row: Record<string, unknown> = { status };
    if (status === 'paid') row['paid_at'] = new Date().toISOString();
    await db.client().from('tel_bills').update(row).eq('id', id);
  },

  // ── Dealers ───────────────────────────────────────────────────────────────────
  async createDealer(d: Omit<TelecomDealer, 'id' | 'createdAt'>): Promise<TelecomDealer> {
    const row: Record<string, unknown> = {
      operator_id: d.operatorId, user_id: d.userId, name: d.name, code: d.code,
      tier: d.tier, country: d.country, city: d.city, phone: d.phone,
      wallet_balance: d.walletBalance, currency: d.currency, status: d.status,
    };
    if (d.email)     row['email']      = d.email;
    if (d.managerId) row['manager_id'] = d.managerId;
    const { data, error } = await db.client().from('tel_dealers').insert(row).select().single();
    if (error) throw error;
    return mapDealer(data as Record<string, unknown>);
  },

  async getDealer(id: string): Promise<TelecomDealer | null> {
    const { data } = await db.client().from('tel_dealers').select('*').eq('id', id).single();
    return data ? mapDealer(data as Record<string, unknown>) : null;
  },

  async getDealerByUser(operatorId: string, userId: string): Promise<TelecomDealer | null> {
    const { data } = await db.client().from('tel_dealers').select('*').eq('operator_id', operatorId).eq('user_id', userId).single();
    return data ? mapDealer(data as Record<string, unknown>) : null;
  },

  async listDealers(operatorId: string): Promise<TelecomDealer[]> {
    const { data } = await db.client().from('tel_dealers').select('*').eq('operator_id', operatorId).order('name');
    return (data ?? []).map(r => mapDealer(r as Record<string, unknown>));
  },

  async updateDealerWallet(dealerId: string, delta: number): Promise<void> {
    const dealer = await TelecomRepository.getDealer(dealerId);
    if (!dealer) return;
    await db.client().from('tel_dealers').update({ wallet_balance: dealer.walletBalance + delta }).eq('id', dealerId);
  },

  // ── Commissions ───────────────────────────────────────────────────────────────
  async createCommission(c: Omit<Commission, 'id' | 'createdAt'>): Promise<Commission> {
    const row: Record<string, unknown> = {
      operator_id: c.operatorId, dealer_id: c.dealerId, type: c.type,
      base_amount: c.baseAmount, rate: c.rate, amount: c.amount,
      currency: c.currency, status: c.status,
    };
    if (c.rechargeId) row['recharge_id'] = c.rechargeId;
    const { data, error } = await db.client().from('tel_commissions').insert(row).select().single();
    if (error) throw error;
    return mapCommission(data as Record<string, unknown>);
  },

  async listCommissions(dealerId: string, status?: string): Promise<Commission[]> {
    let q = db.client().from('tel_commissions').select('*').eq('dealer_id', dealerId);
    if (status) q = q.eq('status', status);
    const { data } = await q.order('created_at', { ascending: false });
    return (data ?? []).map(r => mapCommission(r as Record<string, unknown>));
  },

  async getCommissionRules(operatorId: string): Promise<CommissionRule[]> {
    const { data } = await db.client().from('tel_commission_rules').select('*').eq('operator_id', operatorId);
    return (data ?? []).map(r => {
      const row = r as Record<string, unknown>;
      const rule: CommissionRule = {
        operatorId,
        type:        String(row['type'] ?? '') as CommissionRule['type'],
        dealerTier:  String(row['dealer_tier'] ?? 'agent') as CommissionRule['dealerTier'],
        ratePercent: Number(row['rate_percent'] ?? 0),
        minAmount:   Number(row['min_amount'] ?? 0),
      };
      if (row['bonus_amount']) rule.bonusAmount = Number(row['bonus_amount']);
      return rule;
    });
  },

  // ── Fraud ─────────────────────────────────────────────────────────────────────
  async createFraudEvent(f: Omit<FraudEvent, 'id' | 'createdAt'>): Promise<FraudEvent> {
    const row: Record<string, unknown> = {
      operator_id: f.operatorId, type: f.type, risk_score: f.riskScore,
      details: f.details, action: f.action,
    };
    if (f.userId)   row['user_id']   = f.userId;
    if (f.dealerId) row['dealer_id'] = f.dealerId;
    const { data, error } = await db.client().from('tel_fraud_events').insert(row).select().single();
    if (error) throw error;
    const rd = data as Record<string, unknown>;
    return { ...f, id: String(rd['id'] ?? ''), createdAt: String(rd['created_at'] ?? '') };
  },

  async listFraudEvents(operatorId: string, limit = 50): Promise<FraudEvent[]> {
    const { data } = await db.client()
      .from('tel_fraud_events').select('*').eq('operator_id', operatorId)
      .order('created_at', { ascending: false }).limit(limit);
    return (data ?? []).map(r => {
      const row = r as Record<string, unknown>;
      const ev: FraudEvent = {
        id: String(row['id'] ?? ''), operatorId,
        type:      (row['type'] as FraudEvent['type']) ?? 'fake_recharge',
        riskScore: Number(row['risk_score'] ?? 0),
        details:   (row['details'] as Record<string, unknown>) ?? {},
        action:    (row['action'] as FraudEvent['action']) ?? 'flagged',
        createdAt: String(row['created_at'] ?? ''),
      };
      if (row['user_id'])   ev.userId   = String(row['user_id']);
      if (row['dealer_id']) ev.dealerId = String(row['dealer_id']);
      return ev;
    });
  },

  // ── Retry Queue ───────────────────────────────────────────────────────────────
  async enqueueRetry(operatorId: string, rechargeId: string, delay: number, error: string): Promise<void> {
    await db.client().from('tel_retry_queue').insert({
      operator_id: operatorId, recharge_id: rechargeId, attempts: 1,
      next_retry_at: new Date(Date.now() + delay).toISOString(),
      last_error: error,
    });
  },

  async getDueRetries(operatorId: string): Promise<Array<{ id: string; rechargeId: string; attempts: number }>> {
    const { data } = await db.client()
      .from('tel_retry_queue').select('id, recharge_id, attempts')
      .eq('operator_id', operatorId)
      .lte('next_retry_at', new Date().toISOString())
      .limit(10);
    return (data ?? []).map(r => {
      const row = r as Record<string, unknown>;
      return { id: String(row['id'] ?? ''), rechargeId: String(row['recharge_id'] ?? ''), attempts: Number(row['attempts'] ?? 0) };
    });
  },

  async removeRetry(id: string): Promise<void> {
    await db.client().from('tel_retry_queue').delete().eq('id', id);
  },
};

// ── Mappers ───────────────────────────────────────────────────────────────────
function mapOp(r: Record<string, unknown>): TelecomOperator {
  const op: TelecomOperator = {
    id:       String(r['id'] ?? ''), name: String(r['name'] ?? ''), code: String(r['code'] ?? ''),
    country:  String(r['country'] ?? 'HT'), currency: String(r['currency'] ?? 'HTG'),
    apiType:  (r['api_type'] as TelecomOperator['apiType']) ?? 'mock',
    isActive: Boolean(r['is_active'] ?? true), ownerId: String(r['owner_id'] ?? ''),
    createdAt: String(r['created_at'] ?? ''),
  };
  if (r['logo_url']) op.logoUrl = String(r['logo_url']);
  if (r['website'])  op.website = String(r['website']);
  return op;
}

function mapBundle(r: Record<string, unknown>): TelecomBundle {
  const b: TelecomBundle = {
    id: String(r['id'] ?? ''), operatorId: String(r['operator_id'] ?? ''),
    name: String(r['name'] ?? ''), code: String(r['code'] ?? ''),
    type: (r['type'] as TelecomBundle['type']) ?? 'combo',
    description: String(r['description'] ?? ''), price: Number(r['price'] ?? 0),
    currency: String(r['currency'] ?? 'HTG'), validityDays: Number(r['validity_days'] ?? 30),
    isRenewable: Boolean(r['is_renewable'] ?? true),
    countries: (r['countries'] as string[]) ?? [], tags: (r['tags'] as string[]) ?? [],
    isActive: Boolean(r['is_active'] ?? true), createdAt: String(r['created_at'] ?? ''),
  };
  if (r['data_gb'])      b.dataGb      = Number(r['data_gb']);
  if (r['minutes_mins']) b.minutesMins = Number(r['minutes_mins']);
  if (r['sms_count'])    b.smsCount    = Number(r['sms_count']);
  if (r['speed'])        b.speed       = String(r['speed']);
  if (r['coverage'])     b.coverage    = String(r['coverage']);
  if (r['bonus'])        b.bonus       = String(r['bonus']);
  return b;
}

function mapRecharge(r: Record<string, unknown>): TelecomRecharge {
  const rc: TelecomRecharge = {
    id: String(r['id'] ?? ''), operatorId: String(r['operator_id'] ?? ''),
    userId: String(r['user_id'] ?? ''), type: (r['type'] as TelecomRecharge['type']) ?? 'prepaid',
    phone: String(r['phone'] ?? ''), amount: Number(r['amount'] ?? 0),
    currency: String(r['currency'] ?? 'HTG'),
    status: (r['status'] as TelecomRecharge['status']) ?? 'pending',
    createdAt: String(r['created_at'] ?? ''),
  };
  if (r['dealer_id'])    rc.dealerId    = String(r['dealer_id']);
  if (r['bundle_id'])    rc.bundleId    = String(r['bundle_id']);
  if (r['external_ref']) rc.externalRef = String(r['external_ref']);
  if (r['fail_reason'])  rc.failReason  = String(r['fail_reason']);
  if (r['scheduled_at']) rc.scheduledAt = String(r['scheduled_at']);
  if (r['completed_at']) rc.completedAt = String(r['completed_at']);
  if (r['refunded_at'])  rc.refundedAt  = String(r['refunded_at']);
  return rc;
}

function mapSIM(r: Record<string, unknown>): SIMCard {
  const s: SIMCard = {
    id: String(r['id'] ?? ''), operatorId: String(r['operator_id'] ?? ''),
    userId: String(r['user_id'] ?? ''), iccid: String(r['iccid'] ?? ''),
    msisdn: String(r['msisdn'] ?? ''), type: (r['type'] as SIMCard['type']) ?? 'physical',
    status: (r['status'] as SIMCard['status']) ?? 'unregistered',
    kycStatus: (r['kyc_status'] as SIMCard['kycStatus']) ?? 'pending',
    country: String(r['country'] ?? 'HT'), createdAt: String(r['created_at'] ?? ''),
  };
  if (r['activated_at']) s.activatedAt = String(r['activated_at']);
  if (r['expires_at'])   s.expiresAt   = String(r['expires_at']);
  return s;
}

function mapBill(r: Record<string, unknown>): TelecomBill {
  const b: TelecomBill = {
    id: String(r['id'] ?? ''), operatorId: String(r['operator_id'] ?? ''),
    userId: String(r['user_id'] ?? ''), phone: String(r['phone'] ?? ''),
    period: String(r['period'] ?? ''), amount: Number(r['amount'] ?? 0),
    currency: String(r['currency'] ?? 'HTG'), dueDate: String(r['due_date'] ?? ''),
    status: (r['status'] as TelecomBill['status']) ?? 'pending',
    items: (r['items'] as TelecomBill['items']) ?? [], createdAt: String(r['created_at'] ?? ''),
  };
  if (r['paid_at'])   b.paidAt   = String(r['paid_at']);
  if (r['late_fee'])  b.lateFee  = Number(r['late_fee']);
  return b;
}

function mapDealer(r: Record<string, unknown>): TelecomDealer {
  const d: TelecomDealer = {
    id: String(r['id'] ?? ''), operatorId: String(r['operator_id'] ?? ''),
    userId: String(r['user_id'] ?? ''), name: String(r['name'] ?? ''),
    code: String(r['code'] ?? ''), tier: (r['tier'] as TelecomDealer['tier']) ?? 'agent',
    country: String(r['country'] ?? 'HT'), city: String(r['city'] ?? ''),
    phone: String(r['phone'] ?? ''), walletBalance: Number(r['wallet_balance'] ?? 0),
    currency: String(r['currency'] ?? 'HTG'),
    status: (r['status'] as TelecomDealer['status']) ?? 'active',
    createdAt: String(r['created_at'] ?? ''),
  };
  if (r['email'])      d.email     = String(r['email']);
  if (r['manager_id']) d.managerId = String(r['manager_id']);
  return d;
}

function mapCommission(r: Record<string, unknown>): Commission {
  const c: Commission = {
    id: String(r['id'] ?? ''), operatorId: String(r['operator_id'] ?? ''),
    dealerId: String(r['dealer_id'] ?? ''),
    type: (r['type'] as Commission['type']) ?? 'recharge',
    baseAmount: Number(r['base_amount'] ?? 0), rate: Number(r['rate'] ?? 0),
    amount: Number(r['amount'] ?? 0), currency: String(r['currency'] ?? 'HTG'),
    status: (r['status'] as Commission['status']) ?? 'pending',
    createdAt: String(r['created_at'] ?? ''),
  };
  if (r['recharge_id']) c.rechargeId = String(r['recharge_id']);
  if (r['paid_at'])     c.paidAt     = String(r['paid_at']);
  return c;
}