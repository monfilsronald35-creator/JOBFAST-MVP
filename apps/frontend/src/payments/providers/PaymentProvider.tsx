import React, { createContext, useContext, useMemo } from 'react';
import { PaymentGateway }       from '../gateway/PaymentGateway';
import { PaymentRouter }        from '../gateway/PaymentRouter';
import { PaymentOrchestrator }  from '../gateway/PaymentOrchestrator';
import { SettlementEngine }     from '../engines/SettlementEngine';
import { ClearingEngine }       from '../engines/ClearingEngine';
import { TreasuryEngine }       from '../engines/TreasuryEngine';
import { ReconciliationEngine } from '../engines/ReconciliationEngine';
import { FinancialLedger }      from '../engines/FinancialLedger';
import { WalletEngine }         from '../engines/WalletEngine';
import { SubscriptionEngine }   from '../engines/SubscriptionEngine';
import { CurrencyEngine }       from '../engines/CurrencyEngine';
import { CardEngine }           from '../engines/CardEngine';
import { EscrowEngine }         from '../engines/EscrowEngine';
import { KYCEngine }            from '../compliance/KYCEngine';
import { AMLEngine }            from '../compliance/AMLEngine';
import { RiskEngine }           from '../compliance/RiskEngine';
import { SanctionsEngine }      from '../compliance/SanctionsEngine';
import { MerchantEngine }       from '../merchant/MerchantEngine';
import { PayoutEngine }         from '../merchant/PayoutEngine';
import { PaymentSDK }           from '../developer/PaymentSDK';
import {
  createStripeProvider }        from '../gateway/providers/StripeProvider';
import {
  createMonCashProvider,
  createNatCashProvider }       from '../gateway/providers/HaitiProvider';
import {
  createApplePayProvider,
  createGooglePayProvider,
  createSamsungPayProvider }    from '../gateway/providers/MobileWalletProvider';
import {
  createPIXProvider,
  createUPIProvider,
  createMpesaProvider }         from '../gateway/providers/RegionalProvider';
import {
  createPayPalProvider,
  createWiseProvider,
  createRevolutProvider }       from '../gateway/providers/FintechProvider';
import {
  createSEPAProvider,
  createACHProvider,
  createSWIFTProvider }         from '../gateway/providers/BankProvider';
import { createCryptoProvider } from '../gateway/providers/CryptoProvider';

export interface PaymentContextValue {
  gateway:         typeof PaymentGateway;
  router:          typeof PaymentRouter;
  orchestrator:    typeof PaymentOrchestrator;
  settlement:      typeof SettlementEngine;
  clearing:        typeof ClearingEngine;
  treasury:        typeof TreasuryEngine;
  reconciliation:  typeof ReconciliationEngine;
  ledger:          typeof FinancialLedger;
  wallet:          typeof WalletEngine;
  subscription:    typeof SubscriptionEngine;
  currency:        typeof CurrencyEngine;
  card:            typeof CardEngine;
  escrow:          typeof EscrowEngine;
  kyc:             typeof KYCEngine;
  aml:             typeof AMLEngine;
  risk:            typeof RiskEngine;
  sanctions:       typeof SanctionsEngine;
  merchant:        typeof MerchantEngine;
  payout:          typeof PayoutEngine;
  sdk:             typeof PaymentSDK;
}

const PaymentContext = createContext<PaymentContextValue | null>(null);

export interface PaymentProviderProps {
  children:         React.ReactNode;
  enabledProviders?: string[];
}

export function PaymentProvider({ children, enabledProviders }: PaymentProviderProps) {
  // Register all payment providers on mount (idempotent)
  useMemo(() => {
    const providers = [
      createStripeProvider(),
      createMonCashProvider(),
      createNatCashProvider(),
      createApplePayProvider(),
      createGooglePayProvider(),
      createSamsungPayProvider(),
      createPIXProvider(),
      createUPIProvider(),
      createMpesaProvider(),
      createPayPalProvider(),
      createWiseProvider(),
      createRevolutProvider(),
      createSEPAProvider(),
      createACHProvider(),
      createSWIFTProvider(),
      createCryptoProvider(),
    ];

    const filter = enabledProviders ? new Set(enabledProviders) : null;
    providers.forEach(p => {
      if (!filter || filter.has(p.id)) PaymentGateway.register(p);
    });
  }, []);

  const value = useMemo<PaymentContextValue>(() => ({
    gateway:        PaymentGateway,
    router:         PaymentRouter,
    orchestrator:   PaymentOrchestrator,
    settlement:     SettlementEngine,
    clearing:       ClearingEngine,
    treasury:       TreasuryEngine,
    reconciliation: ReconciliationEngine,
    ledger:         FinancialLedger,
    wallet:         WalletEngine,
    subscription:   SubscriptionEngine,
    currency:       CurrencyEngine,
    card:           CardEngine,
    escrow:         EscrowEngine,
    kyc:            KYCEngine,
    aml:            AMLEngine,
    risk:           RiskEngine,
    sanctions:      SanctionsEngine,
    merchant:       MerchantEngine,
    payout:         PayoutEngine,
    sdk:            PaymentSDK,
  }), []);

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
}

export function usePaymentContext(): PaymentContextValue {
  const ctx = useContext(PaymentContext);
  if (!ctx) throw new Error('usePaymentContext must be used within <PaymentProvider>');
  return ctx;
}
