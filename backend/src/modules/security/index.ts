/**
 * Global Enterprise Security Platform Module (Backend)
 * Owns: Audit Engine, Fraud Engine, Bot Detection, Device Intelligence,
 *       Threat Detection, Encryption Engine, Secrets Manager, Compliance,
 *       Incident Response, Security Monitoring
 * Tables: sec_audit_log (partitioned), sec_devices, sec_incidents,
 *         sec_blocked_entities, sec_consent_records
 * Prefix: sec_
 * Migration: 031_security_platform.sql (run manually in Supabase SQL Editor)
 *
 * The security middleware (securityMiddleware) is registered in app.ts BEFORE
 * all domain modules so every request passes through it.
 *
 * This module registers only the admin/user-facing REST API routes.
 * Threat detection listens to all domain events via TypedEventBus.
 */
import type { Express }          from 'express';
import { securityRouter }        from './routes/security.routes.js';
import { ThreatDetectionService } from './services/ThreatDetectionService.js';
import { SecretsManager }        from './services/SecretsManager.js';
import { TypedEventBus }         from '../../core/events/TypedEventBus.js';

export { securityMiddleware }    from './middleware/securityMiddleware.js';
export { EncryptionEngine }      from './services/EncryptionEngine.js';
export { SecretsManager }        from './services/SecretsManager.js';
export { AuditEngine }           from './services/AuditEngine.js';

export function registerSecurityModule(app: Express): void {
  // Validate required secrets on boot
  SecretsManager.validateOnStartup();

  // REST API for admin security management + user privacy controls
  app.use('/api/security', securityRouter);

  // Passive threat detection — subscribe to ALL domain events
  TypedEventBus.subscribeAll(envelope => {
    ThreatDetectionService.analyzeEvent(envelope).catch(() => {
      // Never let threat analysis crash the app
    });
  });
}