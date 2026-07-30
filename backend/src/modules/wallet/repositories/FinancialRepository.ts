import { db } from '../../../core/database/SupabaseClient.js';
import { AppError } from '../../../core/errors/AppError.js';
import {
  EscrowStatus, CardStatus, BankAccountStatus, InvoiceStatus, RiskLevel,
  type Escrow, type VirtualCard, type BankAccount, type ExchangeRate,
  type ExchangeTransaction, type Invoice, type InvoiceItem, type RiskScore, type FraudFlag,
} from '../types/financial.types.js';

function toEscrow(r: Record<string, unknown>): Escrow {
  const base: Escrow = {
    id: r['id'] as string, payerId: r['payer_id'] as string, payeeId: r['payee_id'] as string,
    walletId: r['wallet_id'] as string, amount: r['amount'] as number,
    currency: r['currency'] as string, status: r['status'] as EscrowStatus,
    reference: r['reference'] as string, createdAt: r['created_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['order_id'])    b['orderId']    = r['order_id'];
  if (r['job_id'])      b['jobId']      = r['job_id'];
  if (r['notes'])       b['notes']      = r['notes'];
  if (r['expires_at'])  b['expiresAt']  = r['expires_at'];
  if (r['released_at']) b['releasedAt'] = r['released_at'];
  if (r['refunded_at']) b['refundedAt'] = r['refunded_at'];
  return base;
}

function toCard(r: Record<string, unknown>): VirtualCard {
  const base: VirtualCard = {
    id: r['id'] as string, walletId: r['wallet_id'] as string, ownerId: r['owner_id'] as string,
    last4: r['last4'] as string, expiryMonth: r['expiry_month'] as number,
    expiryYear: r['expiry_year'] as number, status: r['status'] as CardStatus,
    spendLimit: r['spend_limit'] as number, currency: r['currency'] as string,
    isDisposable: r['is_disposable'] as boolean,
    createdAt: r['created_at'] as string, updatedAt: r['updated_at'] as string,
  };
  if (r['nickname']) (base as unknown as Record<string, unknown>)['nickname'] = r['nickname'];
  return base;
}

function toBankAccount(r: Record<string, unknown>): BankAccount {
  const base: BankAccount = {
    id: r['id'] as string, walletId: r['wallet_id'] as string, ownerId: r['owner_id'] as string,
    bankName: r['bank_name'] as string, accountName: r['account_name'] as string,
    accountNumber: r['account_number'] as string,
    country: r['country'] as string, currency: r['currency'] as string,
    status: r['status'] as BankAccountStatus, createdAt: r['created_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['routing_number']) b['routingNumber'] = r['routing_number'];
  if (r['swift_code'])     b['swiftCode']     = r['swift_code'];
  if (r['iban'])           b['iban']          = r['iban'];
  return base;
}

function toInvoice(r: Record<string, unknown>): Invoice {
  const base: Invoice = {
    id: r['id'] as string, issuerId: r['issuer_id'] as string,
    recipientId: r['recipient_id'] as string, number: r['number'] as string,
    status: r['status'] as InvoiceStatus, currency: r['currency'] as string,
    subtotal: r['subtotal'] as number, taxAmount: r['tax_amount'] as number,
    total: r['total'] as number, createdAt: r['created_at'] as string, updatedAt: r['updated_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['due_date']) b['dueDate'] = r['due_date'];
  if (r['paid_at'])  b['paidAt']  = r['paid_at'];
  if (r['notes'])    b['notes']   = r['notes'];
  return base;
}

export const FinancialRepository = {
  // ——— Escrow ———————————————————————————————————————————————————————————————
  async lockEscrow(payerWalletId: string, payerId: string, payeeId: string,
    currency: string, amount: number, reference: string,
    opts: { orderId?: string; jobId?: string; expiresAt?: string } = {}
  ): Promise<{ success: boolean; escrowId: string; message: string }> {
    const { data, error } = await db.client().rpc('wlt_lock_escrow', {
      p_payer_wallet: payerWalletId, p_payer_id: payerId, p_payee_id: payeeId,
      p_currency: currency, p_amount: amount, p_reference: reference,
      p_order_id: opts.orderId ?? null, p_job_id: opts.jobId ?? null,
      p_expires_at: opts.expiresAt ?? null,
    }).single<Record<string, unknown>>();
    if (error) throw new AppError('Escrow lock failed: ' + error.message, 500, 'TX_ERROR');
    return { success: data!['success'] as boolean, escrowId: data!['escrow_id'] as string, message: data!['message'] as string };
  },

  async releaseEscrow(escrowId: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await db.client().rpc('wlt_release_escrow', { p_escrow_id: escrowId })
      .single<Record<string, unknown>>();
    if (error) throw new AppError('Escrow release failed: ' + error.message, 500, 'TX_ERROR');
    return { success: data!['success'] as boolean, message: data!['message'] as string };
  },

  async refundEscrow(escrowId: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await db.client().rpc('wlt_refund_escrow', { p_escrow_id: escrowId })
      .single<Record<string, unknown>>();
    if (error) throw new AppError('Escrow refund failed: ' + error.message, 500, 'TX_ERROR');
    return { success: data!['success'] as boolean, message: data!['message'] as string };
  },

  async findEscrow(id: string): Promise<Escrow | null> {
    const { data } = await db.client().from('wlt_escrows').select('*').eq('id', id)
      .single<Record<string, unknown>>();
    return data ? toEscrow(data) : null;
  },

  async listEscrowsByPayer(payerId: string): Promise<Escrow[]> {
    const { data, error } = await db.client().from('wlt_escrows').select('*').eq('payer_id', payerId)
      .order('created_at', { ascending: false }).returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list escrows', 500, 'DB_ERROR');
    return (data ?? []).map(toEscrow);
  },

  async updateEscrowStatus(id: string, status: EscrowStatus): Promise<Escrow> {
    const { data, error } = await db.client().from('wlt_escrows')
      .update({ status }).eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to update escrow', 500, 'DB_ERROR');
    return toEscrow(data);
  },

  // ——— Virtual Cards ————————————————————————————————————————————————————————
  async createCard(walletId: string, ownerId: string, data: Omit<VirtualCard, 'id' | 'walletId' | 'ownerId' | 'last4' | 'expiryMonth' | 'expiryYear' | 'createdAt' | 'updatedAt'> & { nickname?: string | undefined }): Promise<VirtualCard> {
    const last4       = Math.floor(1000 + Math.random() * 9000).toString();
    const expiryYear  = new Date().getFullYear() + 3;
    const expiryMonth = new Date().getMonth() + 1;
    const { data: saved, error } = await db.client().from('wlt_virtual_cards').insert({
      wallet_id: walletId, owner_id: ownerId, last4,
      expiry_month: expiryMonth, expiry_year: expiryYear,
      status: data.status, spend_limit: data.spendLimit, currency: data.currency,
      is_disposable: data.isDisposable,
      ...(data.nickname ? { nickname: data.nickname } : {}),
    }).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create card', 500, 'DB_ERROR');
    return toCard(saved);
  },

  async updateCard(id: string, row: Partial<{ status: CardStatus; spendLimit: number; nickname: string }>): Promise<VirtualCard> {
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (row.status     !== undefined) update['status']      = row.status;
    if (row.spendLimit !== undefined) update['spend_limit'] = row.spendLimit;
    if (row.nickname   !== undefined) update['nickname']    = row.nickname;
    const { data, error } = await db.client().from('wlt_virtual_cards')
      .update(update).eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to update card', 500, 'DB_ERROR');
    return toCard(data);
  },

  async listCards(walletId: string): Promise<VirtualCard[]> {
    const { data, error } = await db.client().from('wlt_virtual_cards').select('*')
      .eq('wallet_id', walletId).order('created_at', { ascending: false })
      .returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list cards', 500, 'DB_ERROR');
    return (data ?? []).map(toCard);
  },

  // ——— Bank Accounts ————————————————————————————————————————————————————————
  async addBankAccount(walletId: string, ownerId: string, data: Omit<BankAccount, 'id' | 'walletId' | 'ownerId' | 'status' | 'createdAt'>): Promise<BankAccount> {
    const row: Record<string, unknown> = {
      wallet_id: walletId, owner_id: ownerId,
      bank_name: data.bankName, account_name: data.accountName,
      account_number: data.accountNumber, country: data.country, currency: data.currency,
    };
    if (data.routingNumber) row['routing_number'] = data.routingNumber;
    if (data.swiftCode)     row['swift_code']     = data.swiftCode;
    if (data.iban)          row['iban']           = data.iban;
    const { data: saved, error } = await db.client()
      .from('wlt_bank_accounts').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to add bank account', 500, 'DB_ERROR');
    return toBankAccount(saved);
  },

  async updateBankStatus(id: string, status: BankAccountStatus): Promise<BankAccount> {
    const { data, error } = await db.client().from('wlt_bank_accounts')
      .update({ status }).eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to update bank account', 500, 'DB_ERROR');
    return toBankAccount(data);
  },

  async listBankAccounts(walletId: string): Promise<BankAccount[]> {
    const { data, error } = await db.client().from('wlt_bank_accounts').select('*')
      .eq('wallet_id', walletId).returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list bank accounts', 500, 'DB_ERROR');
    return (data ?? []).map(toBankAccount);
  },

  // ——— Exchange Rates ───────────────────────────────────────────────────────
  async upsertRate(from: string, to: string, rate: number, fee: number): Promise<ExchangeRate> {
    const { data, error } = await db.client().from('wlt_exchange_rates').upsert(
      { from_currency: from, to_currency: to, rate, fee, fetched_at: new Date().toISOString() },
      { onConflict: 'from_currency,to_currency' }
    ).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to upsert rate', 500, 'DB_ERROR');
    return { id: data['id'] as string, fromCurrency: data['from_currency'] as string,
      toCurrency: data['to_currency'] as string, rate: Number(data['rate']),
      fee: Number(data['fee']), fetchedAt: data['fetched_at'] as string };
  },

  async getRate(from: string, to: string): Promise<ExchangeRate | null> {
    const { data } = await db.client().from('wlt_exchange_rates').select('*')
      .eq('from_currency', from).eq('to_currency', to).single<Record<string, unknown>>();
    if (!data) return null;
    return { id: data['id'] as string, fromCurrency: data['from_currency'] as string,
      toCurrency: data['to_currency'] as string, rate: Number(data['rate']),
      fee: Number(data['fee']), fetchedAt: data['fetched_at'] as string };
  },

  async recordExchange(walletId: string, ownerId: string, data: Omit<ExchangeTransaction, 'id' | 'walletId' | 'ownerId' | 'status' | 'createdAt'>): Promise<ExchangeTransaction> {
    const { data: saved, error } = await db.client().from('wlt_exchange_txs').insert({
      wallet_id: walletId, owner_id: ownerId,
      from_currency: data.fromCurrency, to_currency: data.toCurrency,
      from_amount: data.fromAmount, to_amount: data.toAmount,
      rate: data.rate, fee: data.fee,
    }).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to record exchange', 500, 'DB_ERROR');
    return {
      id: saved['id'] as string, walletId: saved['wallet_id'] as string,
      ownerId: saved['owner_id'] as string,
      fromCurrency: saved['from_currency'] as string, toCurrency: saved['to_currency'] as string,
      fromAmount: saved['from_amount'] as number, toAmount: saved['to_amount'] as number,
      rate: Number(saved['rate']), fee: saved['fee'] as number,
      status: saved['status'] as 'completed' | 'failed',
      createdAt: saved['created_at'] as string,
    };
  },

  // ——— Invoices ——————————————————————————————————————————————————————————————
  async createInvoice(data: Omit<Invoice, 'id' | 'number' | 'status' | 'createdAt' | 'updatedAt'>, items: Omit<InvoiceItem, 'id' | 'invoiceId'>[]): Promise<{ invoice: Invoice; items: InvoiceItem[] }> {
    const number = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const { data: inv, error } = await db.client().from('wlt_invoices').insert({
      issuer_id: data.issuerId, recipient_id: data.recipientId,
      number, currency: data.currency, subtotal: data.subtotal,
      tax_amount: data.taxAmount, total: data.total,
      ...(data.dueDate ? { due_date: data.dueDate } : {}),
      ...(data.notes   ? { notes:    data.notes   } : {}),
    }).select('*').single<Record<string, unknown>>();
    if (error ?? !inv) throw new AppError('Failed to create invoice', 500, 'DB_ERROR');
    const invoice = toInvoice(inv);
    const itemRows = items.map(i => ({
      invoice_id: invoice.id, description: i.description,
      quantity: i.quantity, unit_price: i.unitPrice, total: i.total,
      ...(i.taxRate !== undefined ? { tax_rate: i.taxRate } : {}),
    }));
    const { data: savedItems, error: itemErr } = await db.client()
      .from('wlt_invoice_items').insert(itemRows).select('*').returns<Record<string, unknown>[]>();
    if (itemErr) throw new AppError('Failed to create invoice items', 500, 'DB_ERROR');
    const invoiceItems: InvoiceItem[] = (savedItems ?? []).map(r => ({
      id: r['id'] as string, invoiceId: r['invoice_id'] as string,
      description: r['description'] as string, quantity: r['quantity'] as number,
      unitPrice: r['unit_price'] as number, total: r['total'] as number,
      ...(r['tax_rate'] !== null && r['tax_rate'] !== undefined ? { taxRate: Number(r['tax_rate']) } : {}),
    }));
    return { invoice, items: invoiceItems };
  },

  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    const row: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === InvoiceStatus.Paid) row['paid_at'] = new Date().toISOString();
    const { data, error } = await db.client().from('wlt_invoices')
      .update(row).eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to update invoice', 500, 'DB_ERROR');
    return toInvoice(data);
  },

  async listInvoices(issuerId: string): Promise<Invoice[]> {
    const { data, error } = await db.client().from('wlt_invoices').select('*').eq('issuer_id', issuerId)
      .order('created_at', { ascending: false }).returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list invoices', 500, 'DB_ERROR');
    return (data ?? []).map(toInvoice);
  },

  // ——— Risk & Fraud ————————————————————————————————————————————————————————
  async saveRiskScore(data: Omit<RiskScore, 'id' | 'createdAt'>): Promise<RiskScore> {
    const { data: saved, error } = await db.client().from('wlt_risk_scores').insert({
      transaction_id: data.transactionId, wallet_id: data.walletId,
      score: data.score, level: data.level, factors: data.factors, decision: data.decision,
    }).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to save risk score', 500, 'DB_ERROR');
    return {
      id: saved['id'] as string, transactionId: saved['transaction_id'] as string,
      walletId: saved['wallet_id'] as string, score: saved['score'] as number,
      level: saved['level'] as RiskLevel, factors: saved['factors'] as Record<string, number>,
      decision: saved['decision'] as RiskScore['decision'], createdAt: saved['created_at'] as string,
    };
  },

  async createFraudFlag(data: Omit<FraudFlag, 'id' | 'resolved' | 'createdAt'>): Promise<FraudFlag> {
    const { data: saved, error } = await db.client().from('wlt_fraud_flags').insert({
      wallet_id: data.walletId, owner_id: data.ownerId, type: data.type,
      severity: data.severity, description: data.description, metadata: data.metadata,
    }).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create fraud flag', 500, 'DB_ERROR');
    return {
      id: saved['id'] as string, walletId: saved['wallet_id'] as string,
      ownerId: saved['owner_id'] as string, type: saved['type'] as string,
      severity: saved['severity'] as RiskLevel, description: saved['description'] as string,
      metadata: (saved['metadata'] as Record<string, unknown>) ?? {},
      resolved: saved['resolved'] as boolean, createdAt: saved['created_at'] as string,
    };
  },

  async listFraudFlags(walletId: string): Promise<FraudFlag[]> {
    const { data, error } = await db.client().from('wlt_fraud_flags').select('*')
      .eq('wallet_id', walletId).order('created_at', { ascending: false })
      .returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to list fraud flags', 500, 'DB_ERROR');
    return (data ?? []).map(r => ({
      id: r['id'] as string, walletId: r['wallet_id'] as string, ownerId: r['owner_id'] as string,
      type: r['type'] as string, severity: r['severity'] as RiskLevel,
      description: r['description'] as string, metadata: (r['metadata'] as Record<string, unknown>) ?? {},
      resolved: r['resolved'] as boolean, createdAt: r['created_at'] as string,
      ...(r['resolved_at'] ? { resolvedAt: r['resolved_at'] as string } : {}),
    }));
  },
};
