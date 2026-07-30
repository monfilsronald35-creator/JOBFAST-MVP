/**
 * DomainQueues — 8 typed offline queues built on top of src/lib/indexedDb.ts.
 * Reuses the existing `offline_queue` store (no new stores needed).
 * Each domain is a type-tag on the queue item. The request details live in `payload`.
 */

import {
  enqueueOffline as _enqueue,
  getOfflineQueue,
  getDueOfflineItems,
  removeOfflineItem as _remove,
  incrementRetry    as _incRetry,
} from '../../lib/indexedDb';

// ─── Types ────────────────────────────────────────────────────────────────────

export type QueueDomain =
  | 'create'
  | 'update'
  | 'delete'
  | 'payment'
  | 'upload'
  | 'notification'
  | 'job'
  | 'marketplace';

export type QueuePriority = 'critical' | 'high' | 'normal' | 'low';

export interface QueuePayload {
  endpoint: string;
  method:   'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?:    string;
  headers?: Record<string, string>;
  priority: QueuePriority;
  metadata?: Record<string, unknown>;
}

export interface QueueItem {
  id:          string;
  type:        string;
  payload:     QueuePayload;
  retryCount:  number;
  maxRetries:  number;
  createdAt:   number;
  nextRetryAt: number;
  error?:      string;
}

export interface EnqueueOptions {
  priority?:   QueuePriority;
  maxRetries?: number;
  delayMs?:    number;
  headers?:    Record<string, string>;
  metadata?:   Record<string, unknown>;
}

// ─── Internal enqueue ─────────────────────────────────────────────────────────

async function enqueue(
  type:     QueueDomain,
  endpoint: string,
  method:   'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?:    unknown,
  opts:     EnqueueOptions = {},
): Promise<string> {
  const payload: QueuePayload = {
    endpoint,
    method,
    priority: opts.priority ?? 'normal',
    ...(body != null        ? { body:     JSON.stringify(body) } : {}),
    ...(opts.headers        ? { headers:  opts.headers }         : {}),
    ...(opts.metadata       ? { metadata: opts.metadata }        : {}),
  };
  return _enqueue(type, payload, {
    maxRetries: opts.maxRetries ?? 5,
    delayMs:    opts.delayMs   ?? 0,
  });
}

// ─── Domain-specific queues ───────────────────────────────────────────────────

export const CreateQueue = {
  enqueue: (endpoint: string, body: unknown, opts?: EnqueueOptions) =>
    enqueue('create', endpoint, 'POST', body, { priority: 'high', ...opts }),
};

export const UpdateQueue = {
  enqueue: (endpoint: string, body: unknown, opts?: EnqueueOptions) =>
    enqueue('update', endpoint, 'PATCH', body, opts),
};

export const DeleteQueue = {
  enqueue: (endpoint: string, opts?: EnqueueOptions) =>
    enqueue('delete', endpoint, 'DELETE', undefined, opts),
};

export const PaymentQueue = {
  enqueue: (endpoint: string, body: unknown, opts?: EnqueueOptions) =>
    enqueue('payment', endpoint, 'POST', body, { priority: 'critical', maxRetries: 10, ...opts }),
};

export const UploadQueue = {
  enqueue: (endpoint: string, body: unknown, opts?: EnqueueOptions) =>
    enqueue('upload', endpoint, 'POST', body, { priority: 'high', ...opts }),
};

export const NotificationQueue = {
  enqueue: (endpoint: string, body: unknown, opts?: EnqueueOptions) =>
    enqueue('notification', endpoint, 'POST', body, { priority: 'low', ...opts }),
};

export const JobQueue = {
  apply: (jobId: string, body: unknown, opts?: EnqueueOptions) =>
    enqueue('job', `/api/jobs/${jobId}/apply`, 'POST', body, { priority: 'high', ...opts }),
  close: (jobId: string, opts?: EnqueueOptions) =>
    enqueue('job', `/api/jobs/${jobId}`, 'PATCH', { status: 'closed' }, opts),
};

export const MarketplaceQueue = {
  order: (body: unknown, opts?: EnqueueOptions) =>
    enqueue('marketplace', '/api/orders', 'POST', body, { priority: 'high', ...opts }),
  bid: (auctionId: string, body: unknown, opts?: EnqueueOptions) =>
    enqueue('marketplace', `/api/auctions/${auctionId}/bids`, 'POST', body, { priority: 'critical', ...opts }),
};

// ─── Queue inspection ─────────────────────────────────────────────────────────

export async function getQueueStats(): Promise<Record<QueueDomain, number>> {
  const all = await getOfflineQueue() as unknown as QueueItem[];
  const stats: Record<string, number> = {
    create: 0, update: 0, delete: 0, payment: 0,
    upload: 0, notification: 0, job: 0, marketplace: 0,
  };
  for (const item of all) {
    const cur = stats[item.type];
    if (cur !== undefined) stats[item.type] = cur + 1;
  }
  return stats as Record<QueueDomain, number>;
}

export async function getDueItems(domains?: QueueDomain[]): Promise<QueueItem[]> {
  const raw = await getDueOfflineItems() as unknown as QueueItem[];
  if (!domains || domains.length === 0) return raw;
  return raw.filter(item => (domains as string[]).includes(item.type));
}

export function sortByPriority(items: QueueItem[]): QueueItem[] {
  const order: Record<QueuePriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };
  return [...items].sort((a, b) => {
    const pa = order[a.payload?.priority ?? 'normal'];
    const pb = order[b.payload?.priority ?? 'normal'];
    return pa - pb;
  });
}

export async function removeOfflineItem(id: string): Promise<void> {
  return _remove(id);
}

export async function markRetry(id: string, errorMsg?: string): Promise<void> {
  return _incRetry(id, errorMsg);
}

export async function getTotalPending(): Promise<number> {
  const all = await getOfflineQueue();
  return all.length;
}