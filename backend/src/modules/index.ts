/**
 * Module Registry
 * Single entry point that registers all domain modules into the Express app.
 * Order matters: core infrastructure first, then leaf modules.
 * To split a module into its own microservice later:
 *   1. Remove it from here
 *   2. Deploy it on its own port
 *   3. Add a reverse-proxy route here pointing to the external service
 *   — The frontend never changes.
 */
import type { Express } from 'express';

import { registerAuthModule }          from './auth/index.js';
import { registerUsersModule }         from './users/index.js';
import { registerJobsModule }          from './jobs/index.js';
import { registerNotificationsModule } from './notifications/index.js';
import { registerMarketplaceModule }   from './marketplace/index.js';
import { registerWalletModule }        from './wallet/index.js';
import { registerPaymentsModule }      from './payments/index.js';
import { registerChatModule }          from './chat/index.js';
import { registerSearchModule }        from './search/index.js';
import { registerMediaModule }         from './media/index.js';
import { registerMapsModule }          from './maps/index.js';
import { registerAnalyticsModule }     from './analytics/index.js';
import { registerTravelModule }        from './travel/index.js';
import { registerHealthModule }        from './health/index.js';
import { registerTelecomModule }       from './telecom/index.js';
import { registerEnterpriseModule }    from './enterprise/index.js';
import { registerAdminModule }         from './admin/index.js';
import { registerAIModule }            from './ai/index.js';
import { registerIdentityModule }      from './identity/index.js';
import { registerGovernmentModule }    from './government/index.js';
import { registerSecurityModule }     from './security/index.js';
import { registerStorageModule }     from './storage/index.js';
import { registerRealtimeModule }      from './realtime/index.js';
import { registerLocalizationModule }  from './localization/index.js';
import { registerMonetizationModule }  from './monetization/index.js';

export function registerAllModules(app: Express): void {
  // Identity Platform (must be first — other modules may depend on auth context)
  registerIdentityModule(app);

  // Infrastructure modules (no cross-module deps)
  registerAuthModule(app);
  registerUsersModule(app);

  // Core business
  registerJobsModule(app);
  registerMarketplaceModule(app);

  // Financial
  registerPaymentsModule(app);
  registerWalletModule(app);

  // Communication
  registerChatModule(app);
  registerNotificationsModule(app);  // must come AFTER other modules (subscribes to their events)

  // Discovery & Content
  registerSearchModule(app);
  registerMediaModule(app);
  registerStorageModule(app);   // full storage platform (extends media)
  registerMapsModule(app);

  // Verticals
  registerTravelModule(app);
  registerHealthModule(app);
  registerTelecomModule(app);
  registerEnterpriseModule(app);

  // Verticals (continued)
  registerGovernmentModule(app);

  // Platform
  registerAnalyticsModule(app);   // must come AFTER other modules (wildcard subscriber)
  registerSecurityModule(app);    // subscribes to all events for threat detection
  registerAIModule(app);
  registerAdminModule(app);
  registerRealtimeModule(app);      // REST endpoints for sync/presence; gateway is in server.ts
  registerLocalizationModule(app);   // Country context, feature flags, cross-border, analytics
  registerMonetizationModule(app);   // Revenue engine, fee rules, billing, founder dashboard
}
