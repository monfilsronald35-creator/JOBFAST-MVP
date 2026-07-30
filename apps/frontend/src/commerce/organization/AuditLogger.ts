/**
 * AuditLogger — Client-side audit trail emission.
 * Batches events and flushes every 10s or on 20 events.
 */

import type { AuditLog, PermissionResource, PermissionAction } from '../types';

type AuditEntry = Omit<AuditLog, 'id'>;

const _queue: AuditEntry[] = [];
let _timer: ReturnType<typeof setTimeout> | null = null;

const BATCH_SIZE = 20;
const FLUSH_MS   = 10_000;

function getAuth(): string {
  try {
    const u = JSON.parse(localStorage.getItem('jobfast_user') ?? '{}') as { token?: string };
    return u.token ? `Bearer ${u.token}` : '';
  } catch { return ''; }
}

async function flush(): Promise<void> {
  if (_queue.length === 0) return;
  const batch = _queue.splice(0, _queue.length);
  await fetch('/api/audit/batch', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: getAuth() },
    body:    JSON.stringify({ events: batch }),
  }).catch(() => {
    _queue.unshift(...batch.slice(0, 100));
  });
}

function schedule(): void {
  if (_timer) return;
  _timer = setTimeout(() => { _timer = null; void flush(); }, FLUSH_MS);
}

export const AuditLogger = {
  log(entry: AuditEntry): void {
    _queue.push(entry);
    if (_queue.length >= BATCH_SIZE) {
      if (_timer) { clearTimeout(_timer); _timer = null; }
      void flush();
    } else {
      schedule();
    }
  },

  logAction(
    orgId:      string,
    userId:     string,
    resource:   PermissionResource,
    action:     PermissionAction,
    resourceId: string,
    before?:    unknown,
    after?:     unknown,
  ): void {
    this.log({
      orgId,
      userId,
      action:    `${resource}.${action}`,
      resource,
      resourceId,
      before,
      after,
      severity:  'info',
      timestamp: Date.now(),
    });
  },

  async queryLogs(orgId: string, options?: {
    userId?:   string;
    resource?: string;
    from?:     number;
    to?:       number;
    page?:     number;
    limit?:    number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const p = new URLSearchParams({ orgId });
    if (options?.userId)   p.set('userId',   options.userId);
    if (options?.resource) p.set('resource', options.resource);
    if (options?.from)     p.set('from',     String(options.from));
    if (options?.to)       p.set('to',       String(options.to));
    if (options?.page)     p.set('page',     String(options.page));
    if (options?.limit)    p.set('limit',    String(options.limit));
    const res = await fetch(`/api/audit?${p.toString()}`, { headers: { Authorization: getAuth() } });
    return res.json() as Promise<{ logs: AuditLog[]; total: number }>;
  },

  flushNow(): Promise<void> {
    if (_timer) { clearTimeout(_timer); _timer = null; }
    return flush();
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void AuditLogger.flushNow();
  });
}