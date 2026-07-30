/**
 * CommerceProvider — React context for all commerce engines.
 * Mount once near the app root. Children access via useCommerce().
 */

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { CartEngine }       from '../engines/CartEngine';
import { CatalogEngine }    from '../engines/CatalogEngine';
import { PricingEngine }    from '../engines/PricingEngine';
import { AttributeEngine, attributeEngine } from '../engines/AttributeEngine';
import { OrderEngine }      from '../engines/OrderEngine';
import { AutomationEngine } from '../engines/AutomationEngine';
import { PaymentGateway, createMonCashPlugin, createWalletPlugin } from '../payments/PaymentGateway';
import { VendorRegistry }   from '../vendor/VendorRegistry';
import { OrgService }       from '../organization/OrgService';
import { RbacEngine }       from '../organization/RbacEngine';
import { AuditLogger }      from '../organization/AuditLogger';
import { CountryConfigRegistry } from '../country/CountryConfig';
import { PluginRegistry }   from '../plugins/PluginRegistry';
import { WebhookEngine }    from '../api/WebhookEngine';
import { ApiKeyManager }    from '../api/ApiKeyManager';

export interface CommerceContextValue {
  CartEngine:              typeof CartEngine;
  CatalogEngine:           typeof CatalogEngine;
  PricingEngine:           typeof PricingEngine;
  AttributeEngine:         typeof attributeEngine;
  OrderEngine:             typeof OrderEngine;
  AutomationEngine:        typeof AutomationEngine;
  PaymentGateway:          typeof PaymentGateway;
  VendorRegistry:          typeof VendorRegistry;
  OrgService:              typeof OrgService;
  RbacEngine:              typeof RbacEngine;
  AuditLogger:             typeof AuditLogger;
  CountryConfig:           typeof CountryConfigRegistry;
  PluginRegistry:          typeof PluginRegistry;
  WebhookEngine:           typeof WebhookEngine;
  ApiKeyManager:           typeof ApiKeyManager;
}

const CommerceContext = createContext<CommerceContextValue | null>(null);

export interface CommerceProviderProps {
  children:            React.ReactNode;
  defaultCountry?:     string;
  defaultCurrency?:    string;
  enableMoncash?:      boolean;
  moncashClientId?:    string;
  moncashMode?:        'sandbox' | 'live';
  enableStripe?:       boolean;
  stripePublishableKey?: string;
}

export function CommerceProvider({
  children,
  defaultCountry  = 'HT',
  defaultCurrency = 'HTG',
  enableMoncash   = true,
  moncashClientId,
  moncashMode     = 'sandbox',
  enableStripe    = false,
  stripePublishableKey,
}: CommerceProviderProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    CartEngine.setCountry(defaultCountry);
    CartEngine.setCurrency(defaultCurrency);

    if (enableMoncash && moncashClientId) {
      PaymentGateway.register(createMonCashPlugin({ clientId: moncashClientId, mode: moncashMode }));
    }
    PaymentGateway.register(createWalletPlugin());

    if (enableStripe && stripePublishableKey) {
      import('../payments/PaymentGateway').then(({ createStripePlugin }) => {
        PaymentGateway.register(createStripePlugin({ publishableKey: stripePublishableKey }));
      }).catch(() => { /* optional */ });
    }

    void PaymentGateway.initAll();
  }, []);

  const value: CommerceContextValue = {
    CartEngine,
    CatalogEngine,
    PricingEngine,
    AttributeEngine: attributeEngine,
    OrderEngine,
    AutomationEngine,
    PaymentGateway,
    VendorRegistry,
    OrgService,
    RbacEngine,
    AuditLogger,
    CountryConfig: CountryConfigRegistry,
    PluginRegistry,
    WebhookEngine,
    ApiKeyManager,
  };

  return (
    <CommerceContext.Provider value={value}>
      {children}
    </CommerceContext.Provider>
  );
}

export function useCommerce(): CommerceContextValue {
  const ctx = useContext(CommerceContext);
  if (!ctx) throw new Error('useCommerce must be used inside <CommerceProvider>');
  return ctx;
}