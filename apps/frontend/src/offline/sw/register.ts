/**
 * Service Worker registration + update detection.
 * Notifies the app when a new SW is waiting to activate.
 */

export type SWStatus = 'idle' | 'registering' | 'registered' | 'update_available' | 'error';

export interface SWRegistrationState {
  status:           SWStatus;
  registration?:    ServiceWorkerRegistration;
  waitingWorker?:   ServiceWorker;
  error?:           string;
}

type SWListener = (state: SWRegistrationState) => void;

let state: SWRegistrationState = { status: 'idle' };
const listeners: Set<SWListener> = new Set();

function notify(next: SWRegistrationState): void {
  state = next;
  listeners.forEach(fn => fn(state));
}

export function onSWStateChange(fn: SWListener): () => void {
  listeners.add(fn);
  fn(state);
  return () => listeners.delete(fn);
}

export async function registerSW(path = '/sw.js'): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    notify({ status: 'error', error: 'ServiceWorker not supported' });
    return null;
  }

  notify({ status: 'registering' });

  try {
    const reg = await navigator.serviceWorker.register(path, { scope: '/' });

    notify({ status: 'registered', registration: reg });

    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          notify({ status: 'update_available', registration: reg, waitingWorker: newWorker });
        }
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    return reg;
  } catch (err) {
    const msg = String(err);
    notify({ status: 'error', error: msg });
    console.error('[SW register]', msg);
    return null;
  }
}

export function applyUpdate(state: SWRegistrationState): void {
  if (state.waitingWorker) {
    state.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  }
}

export function getState(): SWRegistrationState { return state; }