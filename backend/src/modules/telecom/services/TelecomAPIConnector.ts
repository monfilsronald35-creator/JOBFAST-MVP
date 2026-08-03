import { TelecomRepository }  from '../repositories/TelecomRepository.js';
import type { APICallResult } from '../types/telecom.types.js';

// ── Circuit Breaker state (in-memory per operator) ────────────────────────────
interface CircuitState { failures: number; lastFailure: number; open: boolean; }
const circuits = new Map<string, CircuitState>();
const CIRCUIT_THRESHOLD = 5;
const CIRCUIT_RESET_MS  = 60_000;

function getCircuit(operatorId: string): CircuitState {
  if (!circuits.has(operatorId)) circuits.set(operatorId, { failures: 0, lastFailure: 0, open: false });
  return circuits.get(operatorId)!;
}

function recordSuccess(operatorId: string): void {
  const c = getCircuit(operatorId);
  c.failures = 0; c.open = false;
}

function recordFailure(operatorId: string): void {
  const c = getCircuit(operatorId);
  c.failures += 1; c.lastFailure = Date.now();
  if (c.failures >= CIRCUIT_THRESHOLD) c.open = true;
}

function isOpen(operatorId: string): boolean {
  const c = getCircuit(operatorId);
  if (!c.open) return false;
  if (Date.now() - c.lastFailure > CIRCUIT_RESET_MS) {
    c.open = false; c.failures = 0;
    return false;
  }
  return true;
}

export function getAPIStatus(operatorId: string): 'online' | 'degraded' | 'offline' {
  const c = getCircuit(operatorId);
  if (c.open) return 'offline';
  if (c.failures > 0) return 'degraded';
  return 'online';
}

// ── Connector ─────────────────────────────────────────────────────────────────
export const TelecomAPIConnector = {
  async sendRecharge(operatorId: string, payload: {
    phone: string; amount: number; currency: string; bundleCode?: string; reference: string;
  }): Promise<APICallResult> {
    if (isOpen(operatorId)) {
      return { success: false, message: 'Circuit breaker open — operator API unavailable', retryCount: 0 };
    }

    const cfg = await TelecomRepository.getConfig(operatorId);

    if (!cfg || cfg.sandboxMode) {
      await sleep(50 + Math.random() * 100);
      recordSuccess(operatorId);
      return {
        success:     true,
        externalRef: `MOCK-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        message:     'Test recharge successful',
        retryCount:  0,
      };
    }

    let attempt = 0;
    const maxAttempts = cfg.retryAttempts;

    while (attempt < maxAttempts) {
      try {
        const res = await fetch(`${cfg.apiBaseUrl}/recharge`, {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cfg.apiKey ?? ''}`,
            'X-API-Secret':  cfg.apiSecret ?? '',
          },
          body: JSON.stringify({
            phone:     payload.phone,
            amount:    payload.amount,
            currency:  payload.currency,
            bundle:    payload.bundleCode,
            reference: payload.reference,
          }),
          signal: AbortSignal.timeout(cfg.timeout),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json() as Record<string, unknown>;
        recordSuccess(operatorId);
        return {
          success:     true,
          externalRef: String(body['reference'] ?? body['transactionId'] ?? ''),
          data:        body,
          retryCount:  attempt,
        };
      } catch (err) {
        attempt++;
        if (attempt >= maxAttempts) {
          recordFailure(operatorId);
          return {
            success: false,
            message: err instanceof Error ? err.message : 'Unknown error',
            retryCount: attempt,
          };
        }
        await sleep(1000 * 2 ** (attempt - 1));
      }
    }

    return { success: false, message: 'Max retries exceeded', retryCount: maxAttempts };
  },

  async checkStatus(operatorId: string, externalRef: string): Promise<{ active: boolean; message: string }> {
    const cfg = await TelecomRepository.getConfig(operatorId);
    if (!cfg || cfg.sandboxMode) return { active: true, message: 'Test mode — always active' };

    try {
      const res = await fetch(`${cfg.apiBaseUrl}/status/${externalRef}`, {
        headers: { 'Authorization': `Bearer ${cfg.apiKey ?? ''}` },
        signal: AbortSignal.timeout(cfg.timeout),
      });
      if (!res.ok) return { active: false, message: `HTTP ${res.status}` };
      const body = await res.json() as Record<string, unknown>;
      return { active: Boolean(body['active'] ?? body['status'] === 'active'), message: '' };
    } catch (err) {
      return { active: false, message: err instanceof Error ? err.message : 'Error' };
    }
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}