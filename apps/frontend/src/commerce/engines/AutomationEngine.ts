/**
 * AutomationEngine — Workflow automation (trigger → steps → actions).
 * Client-side: fires events. Server-side handles actual execution.
 * This layer manages local event emission and workflow status.
 */

import type {
  Workflow, WorkflowRun, TriggerEvent, ActionType, StepResult,
} from '../types';

type EventHandler = (data: unknown) => void | Promise<void>;

const _eventBus = new Map<TriggerEvent, Set<EventHandler>>();
const _workflows: Map<string, Workflow> = new Map();
const _runs: Map<string, WorkflowRun[]> = new Map();

function getAuth(): string {
  try {
    const u = JSON.parse(localStorage.getItem('jobfast_user') ?? '{}') as { token?: string };
    return u.token ? `Bearer ${u.token}` : '';
  } catch { return ''; }
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: getAuth(), ...(init.headers as Record<string, string> ?? {}) },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const AutomationEngine = {
  // ─── Event bus (local) ────────────────────────────────────────────────────

  on(event: TriggerEvent, handler: EventHandler): () => void {
    const handlers = _eventBus.get(event) ?? new Set();
    handlers.add(handler);
    _eventBus.set(event, handlers);
    return () => handlers.delete(handler);
  },

  async emit(event: TriggerEvent, data: unknown): Promise<void> {
    const handlers = _eventBus.get(event);
    if (handlers) {
      await Promise.allSettled(Array.from(handlers).map(h => Promise.resolve(h(data))));
    }
    void this.notifyServer(event, data).catch(() => { /* non-fatal */ });
  },

  async notifyServer(event: TriggerEvent, data: unknown): Promise<void> {
    await api('/automation/events', { method: 'POST', body: JSON.stringify({ event, data }) });
  },

  // ─── Workflow CRUD ────────────────────────────────────────────────────────

  async createWorkflow(wf: Omit<Workflow, 'id' | 'runCount' | 'errorCount' | 'createdAt' | 'updatedAt'>): Promise<Workflow> {
    const created = await api<Workflow>('/automation/workflows', { method: 'POST', body: JSON.stringify(wf) });
    _workflows.set(created.id, created);
    return created;
  },

  async updateWorkflow(id: string, data: Partial<Workflow>): Promise<Workflow> {
    const updated = await api<Workflow>(`/automation/workflows/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
    _workflows.set(id, updated);
    return updated;
  },

  async deleteWorkflow(id: string): Promise<void> {
    await api(`/automation/workflows/${id}`, { method: 'DELETE' });
    _workflows.delete(id);
  },

  async getWorkflows(orgId?: string, vendorId?: string): Promise<Workflow[]> {
    const p = new URLSearchParams();
    if (orgId)    p.set('orgId',    orgId);
    if (vendorId) p.set('vendorId', vendorId);
    const wfs = await api<Workflow[]>(`/automation/workflows?${p.toString()}`);
    wfs.forEach(wf => _workflows.set(wf.id, wf));
    return wfs;
  },

  async activateWorkflow(id: string): Promise<Workflow> {
    return this.updateWorkflow(id, { status: 'active' });
  },

  async deactivateWorkflow(id: string): Promise<Workflow> {
    return this.updateWorkflow(id, { status: 'inactive' });
  },

  // ─── Workflow runs ────────────────────────────────────────────────────────

  async getRuns(workflowId: string, limit = 20): Promise<WorkflowRun[]> {
    const runs = await api<WorkflowRun[]>(`/automation/workflows/${workflowId}/runs?limit=${limit}`);
    _runs.set(workflowId, runs);
    return runs;
  },

  async testWorkflow(workflowId: string, context?: Record<string, unknown>): Promise<WorkflowRun> {
    return api<WorkflowRun>(`/automation/workflows/${workflowId}/test`, {
      method: 'POST',
      body:   JSON.stringify({ context }),
    });
  },

  // ─── Built-in action helpers ──────────────────────────────────────────────

  buildAction(type: ActionType, params: Record<string, unknown>) {
    return { type, params, retryMax: 3, timeoutMs: 30_000, onError: 'skip' as const };
  },

  presets: {
    onPaymentSendNotification(userId: string, message: string) {
      return {
        trigger: { event: 'payment.completed' as TriggerEvent },
        steps: [{
          id:     crypto.randomUUID(),
          name:   'Voye notifikasyon',
          action: { type: 'send_notification' as ActionType, params: { userId, message }, retryMax: 3, timeoutMs: 5000, onError: 'skip' as const },
        }],
      };
    },

    onOrderPaidActivateService(serviceType: string) {
      return {
        trigger: { event: 'order.paid' as TriggerEvent },
        steps: [
          { id: crypto.randomUUID(), name: 'Aktive sèvis', action: { type: 'activate_service' as ActionType, params: { serviceType }, retryMax: 5, timeoutMs: 60_000, onError: 'halt' as const } },
          { id: crypto.randomUUID(), name: 'Kreye fakti', action: { type: 'create_invoice' as ActionType, params: {}, retryMax: 3, timeoutMs: 10_000, onError: 'skip' as const }, delayMs: 1000 },
          { id: crypto.randomUUID(), name: 'Mete ajou analitik', action: { type: 'update_analytics' as ActionType, params: {}, retryMax: 1, timeoutMs: 5000, onError: 'skip' as const }, delayMs: 0 },
        ],
      };
    },

    onTopupActivate(carrierId: string) {
      return {
        trigger: {
          event: 'order.paid' as TriggerEvent,
          conditions: [{ field: 'order.items[0].listingType', operator: 'eq' as const, value: 'mobile_topup' }],
        },
        steps: [
          { id: crypto.randomUUID(), name: 'Aktive rechaj', action: { type: 'activate_service' as ActionType, params: { carrierId }, retryMax: 5, timeoutMs: 30_000, onError: 'halt' as const } },
          { id: crypto.randomUUID(), name: 'Voye SMS konfirmasyon', action: { type: 'send_sms' as ActionType, params: { template: 'topup_confirmed' }, retryMax: 3, timeoutMs: 10_000, onError: 'skip' as const }, delayMs: 500 },
          { id: crypto.randomUUID(), name: 'Mete ajou Wallet', action: { type: 'update_wallet' as ActionType, params: { event: 'topup_credited' }, retryMax: 3, timeoutMs: 10_000, onError: 'skip' as const } },
        ],
      };
    },
  },

  // ─── Local state ──────────────────────────────────────────────────────────
  getCachedWorkflows(): Workflow[]                           { return Array.from(_workflows.values()); }
  getCachedRuns(workflowId: string): WorkflowRun[]          { return _runs.get(workflowId) ?? []; }
};