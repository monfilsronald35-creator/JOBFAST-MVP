import { Router }          from 'express';
import { requireAuth }     from '../../../core/middleware/auth.middleware.js';
import { requireRole }     from '../../../core/middleware/auth.middleware.js';
import {
  createPartner, getPartner, listPartners, updatePartner, suspendPartner,
  generateAPIKey, listAPIKeys, revokeAPIKey,
  registerWebhook, listWebhooks, deactivateWebhook, getWebhookDeliveries, retryDelivery,
  oauthAuthorize, oauthToken, registerOAuthClient,
  getPartnerUsageStats, getAllPartnersStats, getRecentLogs, getErrorLogs,
} from '../controllers/IntegrationController.js';

export const integrationRouter = Router();

const A = requireAuth;
const S = requireRole('superadmin');
const AD = requireRole('admin', 'superadmin');

// ── Partners (admin only) ─────────────────────────────────────────────────────
integrationRouter.post(  '/partners',                  A, AD, createPartner);
integrationRouter.get(   '/partners',                  A, AD, listPartners);
integrationRouter.get(   '/partners/:id',              A, AD, getPartner);
integrationRouter.patch( '/partners/:id',              A, AD, updatePartner);
integrationRouter.post(  '/partners/:id/suspend',      A,  S, suspendPartner);

// ── API keys (admin only) ─────────────────────────────────────────────────────
integrationRouter.post(  '/partners/:partnerId/keys',          A, AD, generateAPIKey);
integrationRouter.get(   '/partners/:partnerId/keys',          A, AD, listAPIKeys);
integrationRouter.delete('/partners/:partnerId/keys/:keyId',   A, AD, revokeAPIKey);

// ── Webhooks (admin only) ─────────────────────────────────────────────────────
integrationRouter.post(  '/partners/:partnerId/webhooks',                   A, AD, registerWebhook);
integrationRouter.get(   '/partners/:partnerId/webhooks',                   A, AD, listWebhooks);
integrationRouter.delete('/webhooks/:webhookId',                             A, AD, deactivateWebhook);
integrationRouter.get(   '/webhooks/:webhookId/deliveries',                  A, AD, getWebhookDeliveries);
integrationRouter.post(  '/webhook-deliveries/:deliveryId/retry',            A, AD, retryDelivery);

// ── OAuth2 ────────────────────────────────────────────────────────────────────
integrationRouter.get(  '/oauth/authorize',  A,      oauthAuthorize);
integrationRouter.post( '/oauth/token',              oauthToken);       // no auth — client credentials in body
integrationRouter.post( '/oauth/clients',    A, AD,  registerOAuthClient);

// ── Monitoring (admin only) ───────────────────────────────────────────────────
integrationRouter.get(  '/monitoring/partners',                 A, AD, getAllPartnersStats);
integrationRouter.get(  '/monitoring/partners/:partnerId',      A, AD, getPartnerUsageStats);
integrationRouter.get(  '/monitoring/logs',                     A, AD, getRecentLogs);
integrationRouter.get(  '/monitoring/errors',                   A, AD, getErrorLogs);
