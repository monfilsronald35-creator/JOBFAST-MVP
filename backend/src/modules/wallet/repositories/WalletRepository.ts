import { db } from '../../../core/database/SupabaseClient.js';
import { AppError } from '../../../core/errors/AppError.js';
import {
  WalletStatus,
  type Wallet, type WalletBalance, type Transaction, type TransactionFilter,
  type FeeConfig, type LimitConfig,
} from '../types/wallet.types.js';

function toWallet(r: Record<string, unknown>): Wallet {
  const base: Wallet = {
    id: r['id'] as string, ownerId: r['owner_id'] as string,
    status: r['status'] as WalletStatus,
    createdAt: r['created_at'] as string, updatedAt: r['updated_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['kyc_level']      !== undefined) b['kycLevel']      = r['kyc_level'];
  if (r['daily_spent']    !== undefined) b['dailySpent']    = r['daily_spent'];
  if (r['monthly_spent']  !== undefined) b['monthlySpent']  = r['monthly_spent'];
  return base;
}

function toBalance(r: Record<string, unknown>): WalletBalance {
  return {
    id:               r['id']               as string,
    walletId:         r['wallet_id']        as string,
    currency:         r['currency']         as string,
    availableBalance: r['available_balance'] as number,
    pendingBalance:   r['pending_balance']   as number,
    escrowBalance:    r['escrow_balance']    as number,
    rewardBalance:    r['reward_balance']    as number,
    cashbackBalance:  r['cashback_balance']  as number,
    updatedAt:        r['updated_at']        as string,
  };
}

function toTransaction(r: Record<string, unknown>): Transaction {
  const base: Transaction = {
    id:          r['id']          as string,
    walletId:    r['wallet_id']   as string,
    ownerId:     r['owner_id']    as string,
    type:        r['type']        as Transaction['type'],
    direction:   r['direction']   as Transaction['direction'],
    status:      r['status']      as Transaction['status'],
    amount:      r['amount']      as number,
    fee:         r['fee']         as number,
    netAmount:   r['net_amount']  as number,
    currency:    r['currency']    as string,
    reference:   r['reference']   as string,
    description: r['description'] as string,
    createdAt:   r['created_at']  as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['metadata'])     b['metadata']    = r['metadata'];
  if (r['risk_score'] !== undefined) b['riskScore'] = r['risk_score'];
  if (r['ip_address'])   b['ipAddress']   = r['ip_address'];
  if (r['device_id'])    b['deviceId']    = r['device_id'];
  if (r['country'])      b['country']     = r['country'];
  if (r['related_tx_id']) b['relatedTxId'] = r['related_tx_id'];
  if (r['fail_reason'])  b['failReason']  = r['fail_reason'];
  return base;
}

export const WalletRepository = {
  async createWallet(ownerId: string): Promise<Wallet> {
    const { data, error } = await db.client()
      .from('wlt_wallets').insert({ owner_id: ownerId })
      .select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to create wallet', 500, 'DB_ERROR');
    return toWallet(data);
  },

  async findByOwner(ownerId: string): Promise<Wallet | null> {
    const { data } = await db.client().from('wlt_wallets').select('*')
      .eq('owner_id', ownerId).single<Record<string, unknown>>();
    return data ? toWallet(data) : null;
  },

  async findById(id: string): Promise<Wallet | null> {
    const { data } = await db.client().from('wlt_wallets').select('*')
      .eq('id', id).single<Record<string, unknown>>();
    return data ? toWallet(data) : null;
  },

  async updateStatus(id: string, status: WalletStatus): Promise<Wallet> {
    const { data, error } = await db.client().from('wlt_wallets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to update wallet', 500, 'DB_ERROR');
    return toWallet(data);
  },

  async getBalances(walletId: string): Promise<WalletBalance[]> {
    const { data, error } = await db.client().from('wlt_balances').select('*')
      .eq('wallet_id', walletId).returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to get balances', 500, 'DB_ERROR');
    return (data ?? []).map(toBalance);
  },

  async getBalance(walletId: string, currency: string): Promise<WalletBalance | null> {
    const { data } = await db.client().from('wlt_balances').select('*')
      .eq('wallet_id', walletId).eq('currency', currency).single<Record<string, unknown>>();
    return data ? toBalance(data) : null;
  },

  // ——— ACID credit via RPC ——————————————————————————————————————————————————
  async credit(walletId: string, ownerId: string, currency: string, amount: number,
    txType: string, description: string,
    opts: { fee?: number | undefined; metadata?: Record<string, unknown> | undefined; riskScore?: number | undefined; ip?: string | undefined; deviceId?: string | undefined; country?: string | undefined } = {}
  ): Promise<string> {
    const { data, error } = await db.client().rpc('wlt_credit', {
      p_wallet_id:  walletId, p_owner_id: ownerId, p_currency: currency,
      p_amount: amount, p_type: txType, p_description: description,
      p_fee: opts.fee ?? 0, p_metadata: opts.metadata ?? null,
      p_risk_score: opts.riskScore ?? 0, p_ip: opts.ip ?? null,
      p_device_id: opts.deviceId ?? null, p_country: opts.country ?? null,
    }).single<string>();
    if (error) throw new AppError('Credit failed: ' + error.message, 500, 'TX_ERROR');
    return data as string;
  },

  // ——— ACID debit via RPC ———————————————————————————————————————————————————
  async debit(walletId: string, ownerId: string, currency: string, amount: number,
    txType: string, description: string,
    opts: { fee?: number | undefined; metadata?: Record<string, unknown> | undefined; riskScore?: number | undefined; ip?: string | undefined; deviceId?: string | undefined; country?: string | undefined } = {}
  ): Promise<{ success: boolean; txId: string; message: string }> {
    const { data, error } = await db.client().rpc('wlt_debit', {
      p_wallet_id: walletId, p_owner_id: ownerId, p_currency: currency,
      p_amount: amount, p_type: txType, p_description: description,
      p_fee: opts.fee ?? 0, p_metadata: opts.metadata ?? null,
      p_risk_score: opts.riskScore ?? 0, p_ip: opts.ip ?? null,
      p_device_id: opts.deviceId ?? null, p_country: opts.country ?? null,
    }).single<Record<string, unknown>>();
    if (error) throw new AppError('Debit failed: ' + error.message, 500, 'TX_ERROR');
    return { success: data!['success'] as boolean, txId: data!['tx_id'] as string, message: data!['message'] as string };
  },

  // ——— ACID transfer via RPC ————————————————————————————————————————————————
  async transfer(fromWallet: string, fromOwner: string, toWallet: string, toOwner: string,
    currency: string, amount: number, fee: number, description: string,
    metadata?: Record<string, unknown>
  ): Promise<{ success: boolean; debitTx: string; creditTx: string; message: string }> {
    const { data, error } = await db.client().rpc('wlt_transfer', {
      p_from_wallet: fromWallet, p_from_owner: fromOwner,
      p_to_wallet:   toWallet,   p_to_owner:   toOwner,
      p_currency: currency, p_amount: amount, p_fee: fee,
      p_description: description, p_metadata: metadata ?? null,
    }).single<Record<string, unknown>>();
    if (error) throw new AppError('Transfer failed: ' + error.message, 500, 'TX_ERROR');
    return {
      success:  data!['success']   as boolean,
      debitTx:  data!['debit_tx']  as string,
      creditTx: data!['credit_tx'] as string,
      message:  data!['message']   as string,
    };
  },

  // ——— Transactions ————————————————————————————————————————————————————————
  async listTransactions(walletId: string, filter: TransactionFilter = {}): Promise<Transaction[]> {
    let q = db.client().from('wlt_transactions').select('*').eq('wallet_id', walletId)
              .order('created_at', { ascending: false });
    if (filter.type)      q = q.eq('type',      filter.type);
    if (filter.direction) q = q.eq('direction',  filter.direction);
    if (filter.status)    q = q.eq('status',     filter.status);
    if (filter.currency)  q = q.eq('currency',   filter.currency);
    if (filter.dateFrom)  q = q.gte('created_at', filter.dateFrom);
    if (filter.dateTo)    q = q.lte('created_at', filter.dateTo);
    if (filter.cursor)    q = q.lt('created_at',  filter.cursor);
    q = q.limit(filter.limit ?? 20);
    const { data, error } = await q.returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list transactions', 500, 'DB_ERROR');
    return (data ?? []).map(toTransaction);
  },

  // ——— Fee config ———————————————————————————————————————————————————————————
  async getFeeConfig(txType: string): Promise<FeeConfig | null> {
    const { data } = await db.client().from('wlt_fee_config').select('*')
      .eq('tx_type', txType).eq('is_active', true).single<Record<string, unknown>>();
    if (!data) return null;
    return {
      id: data['id'] as string, txType: data['tx_type'] as string,
      feeType: data['fee_type'] as FeeConfig['feeType'],
      feeValue: Number(data['fee_value']),
      minFee: data['min_fee'] as number, maxFee: data['max_fee'] as number,
      currency: data['currency'] as string, isActive: data['is_active'] as boolean,
      createdAt: data['created_at'] as string,
    };
  },

  // ——— Limit config ————————————————————————————————————————————————————————
  async getLimitConfig(kycLevel: number): Promise<LimitConfig | null> {
    const { data } = await db.client().from('wlt_limit_config').select('*')
      .eq('kyc_level', kycLevel).eq('is_active', true).single<Record<string, unknown>>();
    if (!data) return null;
    return {
      id: data['id'] as string, kycLevel: data['kyc_level'] as number,
      currency: data['currency'] as string,
      maxSingleTx:      data['max_single_tx']       as number,
      maxDailyVolume:   data['max_daily_volume']     as number,
      maxMonthlyVolume: data['max_monthly_volume']   as number,
      maxDailyCount:    data['max_daily_count']      as number,
      isActive: data['is_active'] as boolean,
      createdAt: data['created_at'] as string,
    };
  },
};
