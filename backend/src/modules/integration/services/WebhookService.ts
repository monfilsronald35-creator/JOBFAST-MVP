import { createHmac, randomBytes } from 'crypto';
import { db } from '../../../core/database/SupabaseClient.js';
import type { Webhook, WebhookDelivery } from '../types/integration.types.js';

const MAX_RETRIES   = 3;
const RETRY_DELAYS  = [30_000, 120_000, 600_000]; // 30s, 2min, 10min

export const WebhookService = {
  async register(partnerId: string, params: {
    url: string;
    events: string[];
  }): Promise<Webhook> {
    const secret = randomBytes(32).toString('hex');
    const { data, error } = await db.client()
      .from('int_webhooks')
      .insert({ partner_id: partnerId, url: params.url, secret, events: params.events, active: true })
      .select()
      .single();
    if (error) throw error;
    const hook = _mapHook(data as Record<string, unknown>);
    return hook;
  },

  async listForPartner(partnerId: string): Promise<Webhook[]> {
    const { data, error } = await db.client()
      .from('int_webhooks')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map(_mapHook);
  },

  async deactivate(id: string): Promise<void> {
    const { error } = await db.client().from('int_webhooks').update({ active: false }).eq('id', id);
    if (error) throw error;
  },

  async deliver(webhookId: string, eventName: string, payload: Record<string, unknown>): Promise<WebhookDelivery> {
    // Get webhook
    const { data: hookData } = await db.client()
      .from('int_webhooks')
      .select('url, secret')
      .eq('id', webhookId)
      .eq('active', true)
      .single();
    if (!hookData) throw new Error(`Webhook ${webhookId} not found`);

    const hook = hookData as Record<string, unknown>;
    const body = JSON.stringify({ event: eventName, data: payload, timestamp: Date.now() });
    const sig  = _sign(body, hook['secret'] as string);

    let responseStatus: number | undefined;
    let responseBody: string | undefined;
    let delivered = false;

    try {
      const response = await fetch(hook['url'] as string, {
        method:  'POST',
        headers: {
          'Content-Type':       'application/json',
          'X-JOBFAST-Signature': sig,
          'X-JOBFAST-Event':     eventName,
          'User-Agent':          'JOBFAST-Webhook/1.0',
        },
        body,
        signal: AbortSignal.timeout(10_000),
      });
      responseStatus = response.status;
      responseBody   = (await response.text()).slice(0, 500);
      delivered      = response.ok;
    } catch {
      delivered = false;
    }

    const deliveryPayload: Record<string, unknown> = {
      webhook_id:    webhookId,
      event_name:    eventName,
      payload,
      attempt_count: 1,
      status:        delivered ? 'delivered' : 'failed',
    };
    if (responseStatus !== undefined) deliveryPayload['response_status'] = responseStatus;
    if (responseBody)                 deliveryPayload['response_body']   = responseBody;
    if (delivered) deliveryPayload['delivered_at'] = new Date().toISOString();
    else {
      deliveryPayload['failed_at']    = new Date().toISOString();
      deliveryPayload['next_retry_at'] = new Date(Date.now() + (RETRY_DELAYS[0] ?? 30_000)).toISOString();
      deliveryPayload['status']       = 'retrying';
    }

    const { data, error } = await db.client()
      .from('int_webhook_deliveries')
      .insert(deliveryPayload)
      .select()
      .single();
    if (error) throw error;
    return _mapDelivery(data as Record<string, unknown>);
  },

  async retry(deliveryId: string): Promise<void> {
    const { data } = await db.client()
      .from('int_webhook_deliveries')
      .select('*, int_webhooks(url, secret)')
      .eq('id', deliveryId)
      .single();
    if (!data) return;

    const delivery = data as Record<string, unknown>;
    const webhook  = delivery['int_webhooks'] as Record<string, unknown> | null;
    if (!webhook) return;

    const attemptCount = (delivery['attempt_count'] as number) + 1;
    const payload      = delivery['payload'] as Record<string, unknown>;
    const eventName    = delivery['event_name'] as string;
    const body         = JSON.stringify({ event: eventName, data: payload, timestamp: Date.now() });
    const sig          = _sign(body, webhook['secret'] as string);

    let responseStatus: number | undefined;
    let responseBody: string | undefined;
    let delivered = false;

    try {
      const response = await fetch(webhook['url'] as string, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'X-JOBFAST-Signature': sig, 'X-JOBFAST-Event': eventName },
        body,
        signal: AbortSignal.timeout(10_000),
      });
      responseStatus = response.status;
      responseBody   = (await response.text()).slice(0, 500);
      delivered      = response.ok;
    } catch {
      delivered = false;
    }

    const isMaxRetries = attemptCount >= MAX_RETRIES;
    const updatePayload: Record<string, unknown> = {
      attempt_count: attemptCount,
      status:        delivered ? 'delivered' : isMaxRetries ? 'failed' : 'retrying',
    };
    if (responseStatus !== undefined) updatePayload['response_status'] = responseStatus;
    if (responseBody)                 updatePayload['response_body']   = responseBody;
    if (delivered)      updatePayload['delivered_at']  = new Date().toISOString();
    if (!delivered && !isMaxRetries) {
      const delay = RETRY_DELAYS[attemptCount - 1] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1] ?? 600_000;
      updatePayload['next_retry_at'] = new Date(Date.now() + delay).toISOString();
    }
    if (!delivered && isMaxRetries) updatePayload['failed_at'] = new Date().toISOString();

    await db.client().from('int_webhook_deliveries').update(updatePayload).eq('id', deliveryId);
  },

  async getDeliveries(webhookId: string, limit = 20): Promise<WebhookDelivery[]> {
    const { data, error } = await db.client()
      .from('int_webhook_deliveries')
      .select('*')
      .eq('webhook_id', webhookId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return ((data ?? []) as Record<string, unknown>[]).map(_mapDelivery);
  },

  async getPendingRetries(): Promise<WebhookDelivery[]> {
    const { data } = await db.client()
      .from('int_webhook_deliveries')
      .select('*')
      .eq('status', 'retrying')
      .lte('next_retry_at', new Date().toISOString())
      .limit(50);
    return ((data ?? []) as Record<string, unknown>[]).map(_mapDelivery);
  },
};

function _sign(body: string, secret: string): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

function _mapHook(row: Record<string, unknown>): Webhook {
  return {
    id:        row['id']         as string,
    partnerId: row['partner_id'] as string,
    url:       row['url']        as string,
    events:    (row['events']    as string[]) ?? [],
    active:    row['active']     as boolean,
    createdAt: new Date(row['created_at'] as string).getTime(),
  };
}

function _mapDelivery(row: Record<string, unknown>): WebhookDelivery {
  const d: WebhookDelivery = {
    id:           row['id']           as string,
    webhookId:    row['webhook_id']   as string,
    eventName:    row['event_name']   as string,
    payload:      (row['payload']     as Record<string, unknown>) ?? {},
    attemptCount: (row['attempt_count'] as number) ?? 1,
    status:       row['status']       as WebhookDelivery['status'],
    createdAt:    new Date(row['created_at'] as string).getTime(),
  };
  if (row['response_status'] !== null && row['response_status'] !== undefined)
    d.responseStatus = row['response_status'] as number;
  if (row['response_body'])  d.responseBody = row['response_body'] as string;
  if (row['delivered_at'])   d.deliveredAt  = new Date(row['delivered_at']  as string).getTime();
  if (row['failed_at'])      d.failedAt     = new Date(row['failed_at']     as string).getTime();
  return d;
}
