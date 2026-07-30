/**
 * Network quality detection using Navigator APIs + active probing.
 * Emits quality changes so the engine can adapt (compression, queue, etc.)
 */

import type { NetworkQuality } from '../types';

type NetworkHandler = (quality: NetworkQuality) => void;

interface Connection {
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

declare global {
  interface Navigator { readonly connection?: Connection; }
}

export class NetworkDetector {
  #quality: NetworkQuality = 'good';
  #isOnline: boolean = navigator.onLine;
  #handlers = new Set<NetworkHandler>();
  #probeInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.#detect();
    this.#attachListeners();
  }

  get quality(): NetworkQuality { return this.#quality; }
  get isOnline(): boolean { return this.#isOnline; }

  onChange(fn: NetworkHandler): () => void {
    this.#handlers.add(fn);
    return () => { this.#handlers.delete(fn); };
  }

  startProbing(intervalMs = 30_000): void {
    this.#probeInterval = setInterval(() => this.#probe(), intervalMs);
  }

  stopProbing(): void {
    if (this.#probeInterval) {
      clearInterval(this.#probeInterval);
      this.#probeInterval = null;
    }
  }

  destroy(): void {
    window.removeEventListener('online',  this.#onOnline);
    window.removeEventListener('offline', this.#onOffline);
    navigator.connection?.removeEventListener('change', this.#onConnectionChange);
    this.stopProbing();
  }

  #detect(): void {
    if (!navigator.onLine) {
      this.#setQuality('offline');
      return;
    }

    const conn = navigator.connection;
    if (!conn) {
      this.#setQuality('good');
      return;
    }

    if (conn.saveData) {
      this.#setQuality('slow');
      return;
    }

    switch (conn.effectiveType) {
      case 'slow-2g': case '2g': this.#setQuality('slow');     break;
      case '3g':                  this.#setQuality('good');     break;
      default:
        this.#setQuality(
          (conn.downlink ?? 10) >= 5 ? 'excellent' : 'good'
        );
    }
  }

  async #probe(): Promise<void> {
    if (!navigator.onLine) {
      this.#isOnline = false;
      this.#setQuality('offline');
      return;
    }

    const start = performance.now();
    try {
      await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
      const rtt = performance.now() - start;
      this.#isOnline = true;
      if (rtt < 150)       this.#setQuality('excellent');
      else if (rtt < 500)  this.#setQuality('good');
      else                  this.#setQuality('slow');
    } catch {
      this.#isOnline = false;
      this.#setQuality('offline');
    }
  }

  #setQuality(q: NetworkQuality): void {
    if (q === this.#quality) return;
    this.#quality = q;
    this.#handlers.forEach(fn => { try { fn(q); } catch {} });
  }

  readonly #onOnline = (): void => {
    this.#isOnline = true;
    this.#detect();
  };

  readonly #onOffline = (): void => {
    this.#isOnline = false;
    this.#setQuality('offline');
  };

  readonly #onConnectionChange = (): void => { this.#detect(); };

  #attachListeners(): void {
    window.addEventListener('online',  this.#onOnline);
    window.addEventListener('offline', this.#onOffline);
    navigator.connection?.addEventListener('change', this.#onConnectionChange);
  }
}