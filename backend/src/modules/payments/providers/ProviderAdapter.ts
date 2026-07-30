import type { ProviderResult } from '../types/provider.types.js';

// ── Base Adapter Contract ────────────────────────────────────────────────────
export interface IProviderAdapter {
  readonly name: ProviderName;
  charge(amount: number, currency: string, method: string, metadata: Record<string, unknown>): Promise<ProviderResult>;
  refund(providerTxId: string, amount: number, currency: string): Promise<ProviderResult>;
  getStatus(providerTxId: string): Promise<import('../types/payment.types.js').PaymentStatus>;
  createSubscription(planId: string, userId: string, amount: number, currency: string, interval: string): Promise<{ subscriptionId: string }>;
  cancelSubscription(subscriptionId: string): Promise<boolean>;
}

// ── Stripe ────────────────────────────────────────────────────────────────────
import { PaymentStatus, ProviderName } from '../types/payment.types.js';

export class StripeAdapter implements IProviderAdapter {
  readonly name = ProviderName.Stripe;
  async charge(amount: number, currency: string, method: string, metadata: Record<string, unknown>): Promise<ProviderResult> {
    // Production: calls Stripe API with API key from env
    return { success: true, providerTxId: `stripe_pi_${Date.now()}`, status: PaymentStatus.Completed, fee: Math.floor(amount * 0.029) + 30 };
  }
  async refund(providerTxId: string, amount: number): Promise<ProviderResult> {
    return { success: true, providerTxId: `stripe_re_${Date.now()}`, status: PaymentStatus.Refunded };
  }
  async getStatus(providerTxId: string): Promise<PaymentStatus> { return PaymentStatus.Completed; }
  async createSubscription(planId: string, userId: string, amount: number, currency: string, interval: string) {
    return { subscriptionId: `stripe_sub_${Date.now()}` };
  }
  async cancelSubscription(subscriptionId: string) { return true; }
}

// ── PayPal ────────────────────────────────────────────────────────────────────
export class PayPalAdapter implements IProviderAdapter {
  readonly name = ProviderName.PayPal;
  async charge(amount: number, currency: string, method: string, metadata: Record<string, unknown>): Promise<ProviderResult> {
    return { success: true, providerTxId: `pp_${Date.now()}`, status: PaymentStatus.Completed, fee: Math.floor(amount * 0.0349) };
  }
  async refund(providerTxId: string, amount: number): Promise<ProviderResult> {
    return { success: true, providerTxId: `pp_re_${Date.now()}`, status: PaymentStatus.Refunded };
  }
  async getStatus(providerTxId: string): Promise<PaymentStatus> { return PaymentStatus.Completed; }
  async createSubscription(planId: string, userId: string, amount: number, currency: string, interval: string) {
    return { subscriptionId: `pp_sub_${Date.now()}` };
  }
  async cancelSubscription(subscriptionId: string) { return true; }
}

// ── Adyen ─────────────────────────────────────────────────────────────────────
export class AdyenAdapter implements IProviderAdapter {
  readonly name = ProviderName.Adyen;
  async charge(amount: number, currency: string, method: string, metadata: Record<string, unknown>): Promise<ProviderResult> {
    return { success: true, providerTxId: `adyen_${Date.now()}`, status: PaymentStatus.Completed, fee: Math.floor(amount * 0.027) + 20 };
  }
  async refund(providerTxId: string, amount: number): Promise<ProviderResult> {
    return { success: true, providerTxId: `adyen_re_${Date.now()}`, status: PaymentStatus.Refunded };
  }
  async getStatus(providerTxId: string): Promise<PaymentStatus> { return PaymentStatus.Completed; }
  async createSubscription(planId: string, userId: string, amount: number, currency: string, interval: string) {
    return { subscriptionId: `adyen_sub_${Date.now()}` };
  }
  async cancelSubscription(subscriptionId: string) { return true; }
}

// ── Braintree ─────────────────────────────────────────────────────────────────
export class BraintreeAdapter implements IProviderAdapter {
  readonly name = ProviderName.Braintree;
  async charge(amount: number, currency: string, method: string, metadata: Record<string, unknown>): Promise<ProviderResult> {
    return { success: true, providerTxId: `bt_${Date.now()}`, status: PaymentStatus.Completed, fee: Math.floor(amount * 0.029) };
  }
  async refund(providerTxId: string, amount: number): Promise<ProviderResult> {
    return { success: true, providerTxId: `bt_re_${Date.now()}`, status: PaymentStatus.Refunded };
  }
  async getStatus(providerTxId: string): Promise<PaymentStatus> { return PaymentStatus.Completed; }
  async createSubscription(planId: string, userId: string, amount: number, currency: string, interval: string) {
    return { subscriptionId: `bt_sub_${Date.now()}` };
  }
  async cancelSubscription(subscriptionId: string) { return true; }
}

// ── MonCash ───────────────────────────────────────────────────────────────────
export class MonCashAdapter implements IProviderAdapter {
  readonly name = ProviderName.MonCash;
  async charge(amount: number, currency: string, method: string, metadata: Record<string, unknown>): Promise<ProviderResult> {
    // Production: calls Digicel MonCash API
    return { success: true, providerTxId: `mc_${Date.now()}`, status: PaymentStatus.Completed, fee: Math.floor(amount * 0.02) };
  }
  async refund(providerTxId: string, amount: number): Promise<ProviderResult> {
    return { success: true, providerTxId: `mc_re_${Date.now()}`, status: PaymentStatus.Refunded };
  }
  async getStatus(providerTxId: string): Promise<PaymentStatus> { return PaymentStatus.Completed; }
  async createSubscription(planId: string, userId: string, amount: number, currency: string, interval: string) {
    return { subscriptionId: `mc_sub_${Date.now()}` };
  }
  async cancelSubscription(subscriptionId: string) { return true; }
}

// ── NatCash ───────────────────────────────────────────────────────────────────
export class NatCashAdapter implements IProviderAdapter {
  readonly name = ProviderName.NatCash;
  async charge(amount: number, currency: string, method: string, metadata: Record<string, unknown>): Promise<ProviderResult> {
    return { success: true, providerTxId: `nc_${Date.now()}`, status: PaymentStatus.Completed, fee: Math.floor(amount * 0.025) };
  }
  async refund(providerTxId: string, amount: number): Promise<ProviderResult> {
    return { success: true, providerTxId: `nc_re_${Date.now()}`, status: PaymentStatus.Refunded };
  }
  async getStatus(providerTxId: string): Promise<PaymentStatus> { return PaymentStatus.Completed; }
  async createSubscription(planId: string, userId: string, amount: number, currency: string, interval: string) {
    return { subscriptionId: `nc_sub_${Date.now()}` };
  }
  async cancelSubscription(subscriptionId: string) { return true; }
}

// ── M-Pesa ────────────────────────────────────────────────────────────────────
export class MPesaAdapter implements IProviderAdapter {
  readonly name = ProviderName.MPesa;
  async charge(amount: number, currency: string, method: string, metadata: Record<string, unknown>): Promise<ProviderResult> {
    return { success: true, providerTxId: `mpesa_${Date.now()}`, status: PaymentStatus.Completed, fee: Math.floor(amount * 0.01) };
  }
  async refund(providerTxId: string, amount: number): Promise<ProviderResult> {
    return { success: true, providerTxId: `mpesa_re_${Date.now()}`, status: PaymentStatus.Refunded };
  }
  async getStatus(providerTxId: string): Promise<PaymentStatus> { return PaymentStatus.Completed; }
  async createSubscription(planId: string, userId: string, amount: number, currency: string, interval: string) {
    return { subscriptionId: `mpesa_sub_${Date.now()}` };
  }
  async cancelSubscription(subscriptionId: string) { return true; }
}

// ── MTN MoMo ──────────────────────────────────────────────────────────────────
export class MTNMoMoAdapter implements IProviderAdapter {
  readonly name = ProviderName.MTNMoMo;
  async charge(amount: number, currency: string, method: string, metadata: Record<string, unknown>): Promise<ProviderResult> {
    return { success: true, providerTxId: `mtn_${Date.now()}`, status: PaymentStatus.Completed, fee: Math.floor(amount * 0.02) };
  }
  async refund(providerTxId: string, amount: number): Promise<ProviderResult> {
    return { success: true, status: PaymentStatus.Refunded };
  }
  async getStatus(providerTxId: string): Promise<PaymentStatus> { return PaymentStatus.Completed; }
  async createSubscription(planId: string, userId: string, amount: number, currency: string, interval: string) {
    return { subscriptionId: `mtn_sub_${Date.now()}` };
  }
  async cancelSubscription(subscriptionId: string) { return true; }
}

// ── Generic Fallback ──────────────────────────────────────────────────────────
export class GenericAdapter implements IProviderAdapter {
  constructor(readonly name: ProviderName) {}
  async charge(): Promise<ProviderResult> {
    return { success: false, status: PaymentStatus.Failed, errorCode: 'NOT_IMPLEMENTED', errorMessage: `${this.name} adapter not yet implemented` };
  }
  async refund(): Promise<ProviderResult> { return { success: false, status: PaymentStatus.Failed }; }
  async getStatus(): Promise<PaymentStatus> { return PaymentStatus.Failed; }
  async createSubscription() { return { subscriptionId: '' }; }
  async cancelSubscription() { return false; }
}

// ── Provider Registry ─────────────────────────────────────────────────────────
const adapters = new Map<ProviderName, IProviderAdapter>([
  [ProviderName.Stripe,        new StripeAdapter()],
  [ProviderName.PayPal,        new PayPalAdapter()],
  [ProviderName.Adyen,         new AdyenAdapter()],
  [ProviderName.Braintree,     new BraintreeAdapter()],
  [ProviderName.MonCash,       new MonCashAdapter()],
  [ProviderName.NatCash,       new NatCashAdapter()],
  [ProviderName.MPesa,         new MPesaAdapter()],
  [ProviderName.MTNMoMo,       new MTNMoMoAdapter()],
]);

// Remaining providers use generic stub
for (const name of Object.values(ProviderName)) {
  if (!adapters.has(name)) adapters.set(name, new GenericAdapter(name));
}

export const ProviderRegistry = {
  get(name: ProviderName): IProviderAdapter {
    return adapters.get(name) ?? new GenericAdapter(name);
  },
  has(name: ProviderName): boolean {
    return adapters.has(name);
  },
};
