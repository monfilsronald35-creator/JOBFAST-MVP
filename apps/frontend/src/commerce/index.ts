// ─── Types ────────────────────────────────────────────────────────────────────
export * from './types';

// ─── Engines ──────────────────────────────────────────────────────────────────
export { attributeEngine, AttributeEngine } from './engines/AttributeEngine';
export { PricingEngine }                    from './engines/PricingEngine';
export { CatalogEngine }                    from './engines/CatalogEngine';
export { CartEngine }                       from './engines/CartEngine';
export { OrderEngine }                      from './engines/OrderEngine';
export { AutomationEngine }                 from './engines/AutomationEngine';

// ─── Payments ─────────────────────────────────────────────────────────────────
export {
  PaymentGateway,
  createStripePlugin,
  createMonCashPlugin,
  createMpesaPlugin,
  createWalletPlugin,
} from './payments/PaymentGateway';

// ─── Organization ─────────────────────────────────────────────────────────────
export { OrgService }   from './organization/OrgService';
export { RbacEngine }   from './organization/RbacEngine';
export { AuditLogger }  from './organization/AuditLogger';

// ─── Vendor ───────────────────────────────────────────────────────────────────
export { VendorRegistry } from './vendor/VendorRegistry';

// ─── Country ──────────────────────────────────────────────────────────────────
export { CountryConfigRegistry } from './country/CountryConfig';

// ─── Plugins ──────────────────────────────────────────────────────────────────
export { PluginRegistry }                             from './plugins/PluginRegistry';
export { createPlugin, installPlugin, enablePlugin }  from './plugins/PluginSDK';

// ─── API ──────────────────────────────────────────────────────────────────────
export { WebhookEngine }  from './api/WebhookEngine';
export { ApiKeyManager }  from './api/ApiKeyManager';

// ─── React ────────────────────────────────────────────────────────────────────
export { CommerceProvider, useCommerce } from './providers/CommerceProvider';
export { useCatalog }                    from './hooks/useCatalog';
export { useCart }                       from './hooks/useCart';
export { usePayment }                    from './hooks/usePayment';
export { useVendor }                     from './hooks/useVendor';
export { useOrganization }               from './hooks/useOrganization';
export { useAutomation }                 from './hooks/useAutomation';