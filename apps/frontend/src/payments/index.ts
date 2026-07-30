// ─── Types ────────────────────────────────────────────────────────────────────
export * from './types';

// ─── Gateway ──────────────────────────────────────────────────────────────────
export { PaymentGateway }      from './gateway/PaymentGateway';
export { PaymentRouter }       from './gateway/PaymentRouter';
export { PaymentOrchestrator } from './gateway/PaymentOrchestrator';
export type { OrchestratorOptions } from './gateway/PaymentOrchestrator';
export type { RoutingRule, RoutingDecision } from './gateway/PaymentRouter';

// ─── Payment Providers ────────────────────────────────────────────────────────
export { createStripeProvider }                       from './gateway/providers/StripeProvider';
export { createMonCashProvider, createNatCashProvider } from './gateway/providers/HaitiProvider';
export { createApplePayProvider, createGooglePayProvider, createSamsungPayProvider } from './gateway/providers/MobileWalletProvider';
export { createPIXProvider, createUPIProvider, createMpesaProvider } from './gateway/providers/RegionalProvider';
export { createPayPalProvider, createWiseProvider, createRevolutProvider } from './gateway/providers/FintechProvider';
export { createSEPAProvider, createACHProvider, createSWIFTProvider, createLocalBankProvider } from './gateway/providers/BankProvider';
export { createCryptoProvider, SUPPORTED_CRYPTO }     from './gateway/providers/CryptoProvider';
export type { CryptoAsset }                           from './gateway/providers/CryptoProvider';

// ─── Engines ──────────────────────────────────────────────────────────────────
export { SettlementEngine }     from './engines/SettlementEngine';
export { ClearingEngine }       from './engines/ClearingEngine';
export { TreasuryEngine }       from './engines/TreasuryEngine';
export { ReconciliationEngine } from './engines/ReconciliationEngine';
export { FinancialLedger }      from './engines/FinancialLedger';
export { WalletEngine }         from './engines/WalletEngine';
export { SubscriptionEngine }   from './engines/SubscriptionEngine';
export { CurrencyEngine }       from './engines/CurrencyEngine';
export { CardEngine }           from './engines/CardEngine';
export { EscrowEngine }         from './engines/EscrowEngine';

export type { SettlementBatch, SettlementWindow, SettlementReport } from './engines/SettlementEngine';
export type { ClearingBatch, NettingResult }     from './engines/ClearingEngine';
export type { CashPosition, FloatRecord, LiquidityAlert } from './engines/TreasuryEngine';
export type { ReconciliationResult, DiscrepancyRecord }   from './engines/ReconciliationEngine';
export type { Account, JournalEntry, JournalLine, LedgerBalance } from './engines/FinancialLedger';
export type { ExchangeRate, ConversionResult }   from './engines/CurrencyEngine';
export type { VirtualCard, CardControls }        from './engines/CardEngine';
export type { EscrowAccount }                    from './engines/EscrowEngine';

// ─── Compliance ───────────────────────────────────────────────────────────────
export { KYCEngine }      from './compliance/KYCEngine';
export { AMLEngine }      from './compliance/AMLEngine';
export { RiskEngine }     from './compliance/RiskEngine';
export { SanctionsEngine } from './compliance/SanctionsEngine';
export type { SanctionsList, FullSanctionResult } from './compliance/SanctionsEngine';
export type { RiskSignal }                        from './compliance/RiskEngine';

// ─── Merchant ─────────────────────────────────────────────────────────────────
export { MerchantEngine } from './merchant/MerchantEngine';
export { PayoutEngine }   from './merchant/PayoutEngine';
export type { MerchantProfile, SettlementConfig, MerchantAnalytics, TeamPermission } from './merchant/MerchantEngine';
export type { Payout, PayoutSplit, PayrollEntry } from './merchant/PayoutEngine';

// ─── Developer Platform ───────────────────────────────────────────────────────
export { PaymentSDK }     from './developer/PaymentSDK';
export type { SDKConfig, CheckoutSession } from './developer/PaymentSDK';

// ─── React Layer ──────────────────────────────────────────────────────────────
export { PaymentProvider, usePaymentContext } from './providers/PaymentProvider';
export type { PaymentContextValue, PaymentProviderProps } from './providers/PaymentProvider';

export { usePayment }        from './hooks/usePayment';
export { useWallet, useWalletTransactions } from './hooks/useWallet';
export { useSubscription }   from './hooks/useSubscription';
export { useCheckout }       from './hooks/useCheckout';
export type { CheckoutStep, CheckoutState } from './hooks/useCheckout';
