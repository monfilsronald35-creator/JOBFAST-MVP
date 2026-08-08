import type { Request, Response } from 'express';
import { PartnerService }               from '../services/PartnerService.js';
import { APIKeyService }                from '../services/APIKeyService.js';
import { WebhookService }               from '../services/WebhookService.js';
import { OAuthService }                 from '../services/OAuthService.js';
import { IntegrationMonitoringService } from '../services/IntegrationMonitoringService.js';
import type { PartnerType, PartnerTier, IntegrationScope } from '../types/integration.types.js';

// ── Partner management ────────────────────────────────────────────────────────

export async function createPartner(req: Request, res: Response): Promise<void> {
  try {
    const actorId = String(req.user?.sub ?? '');
    const { name, type, tier, country, contactEmail, website, allowedScopes, metadata } = req.body as Record<string, unknown>;
    const payload: Parameters<typeof PartnerService.create>[1] = {
      name:  String(name  ?? ''),
      type:  (type  as PartnerType)  ?? 'developer',
    };
    if (tier)          payload.tier          = tier          as PartnerTier;
    if (country)       payload.country       = String(country);
    if (contactEmail)  payload.contactEmail  = String(contactEmail);
    if (website)       payload.website       = String(website);
    if (allowedScopes) payload.allowedScopes = allowedScopes as IntegrationScope[];
    if (metadata)      payload.metadata      = metadata      as Record<string, unknown>;

    const partner = await PartnerService.create(actorId, payload);
    res.status(201).json({ partner });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function getPartner(req: Request, res: Response): Promise<void> {
  try {
    const id      = String(req.params['id'] ?? '');
    const partner = await PartnerService.get(id);
    if (!partner) { res.status(404).json({ error: 'Pati pa jwenn' }); return; }
    res.json({ partner });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function listPartners(req: Request, res: Response): Promise<void> {
  try {
    const params: Record<string, unknown> = {};
    if (req.query['type'])   params['type']   = String(req.query['type']);
    if (req.query['status']) params['status'] = String(req.query['status']);
    if (req.query['limit'])  params['limit']  = Number(req.query['limit']);
    const partners = await PartnerService.list(params as Parameters<typeof PartnerService.list>[0]);
    res.json({ partners });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function updatePartner(req: Request, res: Response): Promise<void> {
  try {
    const id      = String(req.params['id'] ?? '');
    const partner = await PartnerService.update(id, req.body as Parameters<typeof PartnerService.update>[1]);
    res.json({ partner });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function suspendPartner(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params['id'] ?? '');
    await PartnerService.suspend(id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

// ── API keys ──────────────────────────────────────────────────────────────────

export async function generateAPIKey(req: Request, res: Response): Promise<void> {
  try {
    const actorId    = String(req.user?.sub ?? '');
    const partnerId  = String(req.params['partnerId'] ?? '');
    const body       = req.body as Record<string, unknown>;
    const params: Parameters<typeof APIKeyService.generate>[2] = {
      name:   String(body['name']   ?? 'API Key'),
      scopes: (body['scopes']       as IntegrationScope[]) ?? [],
    };
    if (body['rateLimitPerMin']) params.rateLimitPerMin = Number(body['rateLimitPerMin']);
    if (body['rateLimitPerDay']) params.rateLimitPerDay = Number(body['rateLimitPerDay']);
    if (body['expiresAt'])       params.expiresAt       = new Date(body['expiresAt'] as string);
    if (body['sandbox'] != null) params.sandbox         = Boolean(body['sandbox']);

    const { key, rawKey } = await APIKeyService.generate(actorId, partnerId, params);
    res.status(201).json({ key, rawKey, warning: 'Konsève rawKey la — li pa pral montre ankò' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function listAPIKeys(req: Request, res: Response): Promise<void> {
  try {
    const partnerId = String(req.params['partnerId'] ?? '');
    const keys      = await APIKeyService.listForPartner(partnerId);
    res.json({ keys });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function revokeAPIKey(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params['keyId'] ?? '');
    await APIKeyService.revoke(id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

// ── Webhooks ──────────────────────────────────────────────────────────────────

export async function registerWebhook(req: Request, res: Response): Promise<void> {
  try {
    const partnerId = String(req.params['partnerId'] ?? '');
    const { url, events } = req.body as { url: string; events?: string[] };
    const webhook = await WebhookService.register(partnerId, { url, events: events ?? [] });
    res.status(201).json({ webhook });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function listWebhooks(req: Request, res: Response): Promise<void> {
  try {
    const partnerId = String(req.params['partnerId'] ?? '');
    const webhooks  = await WebhookService.listForPartner(partnerId);
    res.json({ webhooks });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function deactivateWebhook(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params['webhookId'] ?? '');
    await WebhookService.deactivate(id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function getWebhookDeliveries(req: Request, res: Response): Promise<void> {
  try {
    const id       = String(req.params['webhookId'] ?? '');
    const limit    = req.query['limit'] ? Number(req.query['limit']) : 20;
    const deliveries = await WebhookService.getDeliveries(id, limit);
    res.json({ deliveries });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function retryDelivery(req: Request, res: Response): Promise<void> {
  try {
    const id = String(req.params['deliveryId'] ?? '');
    await WebhookService.retry(id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

// ── OAuth2 ────────────────────────────────────────────────────────────────────

export async function oauthAuthorize(req: Request, res: Response): Promise<void> {
  try {
    const userId   = String(req.user?.sub ?? '');
    const { client_id, redirect_uri, scope } = req.query as Record<string, string>;
    if (!client_id || !redirect_uri) {
      res.status(400).json({ error: 'client_id ak redirect_uri obligatwa' });
      return;
    }
    const scopes = (scope ?? '').split(' ').filter(Boolean) as IntegrationScope[];
    const code   = await OAuthService.issueCode({ clientId: client_id, userId, scopes, redirectUri: redirect_uri });
    const url    = new URL(redirect_uri);
    url.searchParams.set('code', code);
    res.redirect(url.toString());
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function oauthToken(req: Request, res: Response): Promise<void> {
  try {
    const { grant_type, code, client_id, client_secret, redirect_uri } = req.body as Record<string, string>;
    if (grant_type !== 'authorization_code') {
      res.status(400).json({ error: 'Sèlman authorization_code sipòte' });
      return;
    }
    const result = await OAuthService.exchangeCode({ code, clientId: client_id, clientSecret: client_secret, redirectUri: redirect_uri });
    if (!result) { res.status(401).json({ error: 'Kòd oswa secret invalid' }); return; }
    res.json({ access_token: result.accessToken, token_type: 'Bearer', expires_in: result.expiresIn, scope: result.scopes.join(' ') });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function registerOAuthClient(req: Request, res: Response): Promise<void> {
  try {
    const body   = req.body as Record<string, unknown>;
    const params: Parameters<typeof OAuthService.registerClient>[0] = {
      name:          String(body['name']          ?? ''),
      redirectUris:  (body['redirectUris']         as string[])           ?? [],
      allowedScopes: (body['allowedScopes']        as IntegrationScope[]) ?? [],
    };
    if (body['partnerId'])  params.partnerId  = String(body['partnerId']);
    if (body['grantTypes']) params.grantTypes = body['grantTypes'] as string[];
    const { client, secret } = await OAuthService.registerClient(params);
    res.status(201).json({ client, secret, warning: 'Konsève secret la — li pa pral montre ankò' });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

// ── Monitoring ────────────────────────────────────────────────────────────────

export async function getPartnerUsageStats(req: Request, res: Response): Promise<void> {
  try {
    const partnerId = String(req.params['partnerId'] ?? '');
    const stats     = await IntegrationMonitoringService.getPartnerStats(partnerId);
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function getAllPartnersStats(req: Request, res: Response): Promise<void> {
  try {
    const stats = await IntegrationMonitoringService.getAllPartnersStats();
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function getRecentLogs(req: Request, res: Response): Promise<void> {
  try {
    const params: Record<string, unknown> = {};
    if (req.query['partnerId']) params['partnerId'] = String(req.query['partnerId']);
    if (req.query['limit'])     params['limit']     = Number(req.query['limit']);
    const logs = await IntegrationMonitoringService.getRecentLogs(params as { partnerId?: string; limit?: number });
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}

export async function getErrorLogs(req: Request, res: Response): Promise<void> {
  try {
    const partnerId = req.query['partnerId'] ? String(req.query['partnerId']) : undefined;
    const logs      = await IntegrationMonitoringService.getErrorLogs(partnerId);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
