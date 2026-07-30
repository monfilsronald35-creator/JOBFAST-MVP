/**
 * Persistent priority message queue backed by localforage (IndexedDB).
 * Survives page refreshes. Processes on reconnect.
 * Priority order: critical > high > normal > low
 */

import localforage from 'localforage';
import type { QueuedMessage } from '../types';

const STORE_KEY = 'jf_rt_queue';
const MAX_QUEUE  = 500;
const PRIORITY_ORDER: Record<QueuedMessage['priority'], number> = {
  critical: 0, high: 1, normal: 2, low: 3,
};

export class MessageQueue {
  #queue: QueuedMessage[] = [];
  #store: typeof localforage;
  #loaded = false;
  #processing = false;

  constructor() {
    this.#store = localforage.createInstance({
      name:      'jobfast_realtime',
      storeName: 'message_queue',
    });
  }

  get size(): number { return this.#queue.length; }
  get isEmpty(): boolean { return this.#queue.length === 0; }

  async load(): Promise<void> {
    if (this.#loaded) return;
    try {
      const stored = await this.#store.getItem<QueuedMessage[]>(STORE_KEY);
      if (stored) {
        // Drop messages older than 24 hours
        const cutoff = Date.now() - 86_400_000;
        this.#queue = stored.filter(m => m.createdAt > cutoff);
        await this.#persist();
      }
    } catch {}
    this.#loaded = true;
  }

  async enqueue(msg: Omit<QueuedMessage, 'id' | 'attempts' | 'nextRetryAt' | 'createdAt'>): Promise<QueuedMessage> {
    if (this.#queue.length >= MAX_QUEUE) {
      // Drop the lowest-priority oldest message
      const idx = this.#queue.findLastIndex(m => m.priority === 'low') ??
                  this.#queue.length - 1;
      if (idx >= 0) this.#queue.splice(idx, 1);
    }

    const queued: QueuedMessage = {
      id: crypto.randomUUID(),
      attempts: 0,
      nextRetryAt: Date.now(),
      createdAt: Date.now(),
      ...msg,
    };

    this.#queue.push(queued);
    this.#sort();
    await this.#persist();
    return queued;
  }

  peek(): QueuedMessage | undefined {
    return this.#queue.find(m => m.nextRetryAt <= Date.now());
  }

  async dequeue(): Promise<QueuedMessage | undefined> {
    const idx = this.#queue.findIndex(m => m.nextRetryAt <= Date.now());
    if (idx < 0) return undefined;
    const [msg] = this.#queue.splice(idx, 1);
    await this.#persist();
    return msg;
  }

  async markFailed(id: string, retryDelayMs: number): Promise<void> {
    const msg = this.#queue.find(m => m.id === id);
    if (!msg) return;

    if (msg.attempts >= msg.maxAttempts) {
      await this.remove(id);
      return;
    }

    // Mutate via cast since QueuedMessage has mutable `attempts` and `nextRetryAt`
    (msg as { attempts: number }).attempts++;
    (msg as { nextRetryAt: number }).nextRetryAt = Date.now() + retryDelayMs;
    await this.#persist();
  }

  async remove(id: string): Promise<void> {
    this.#queue = this.#queue.filter(m => m.id !== id);
    await this.#persist();
  }

  async clear(): Promise<void> {
    this.#queue = [];
    await this.#store.removeItem(STORE_KEY);
  }

  async drainReady(): Promise<QueuedMessage[]> {
    const now = Date.now();
    const ready = this.#queue.filter(m => m.nextRetryAt <= now);
    this.#queue = this.#queue.filter(m => m.nextRetryAt > now);
    await this.#persist();
    return ready;
  }

  // Process all ready messages using the provided sender.
  // Returns count of successfully sent messages.
  async flush(sender: (msg: QueuedMessage) => Promise<boolean>): Promise<number> {
    if (this.#processing) return 0;
    this.#processing = true;
    let sent = 0;

    const ready = await this.drainReady();
    for (const msg of ready) {
      try {
        const ok = await sender(msg);
        if (ok) {
          sent++;
        } else {
          const backoff = Math.min(1_000 * 2 ** msg.attempts, 30_000);
          await this.markFailed(msg.id, backoff);
        }
      } catch {
        const backoff = Math.min(1_000 * 2 ** msg.attempts, 30_000);
        await this.markFailed(msg.id, backoff);
      }
    }

    this.#processing = false;
    return sent;
  }

  #sort(): void {
    this.#queue.sort((a, b) => {
      const pd = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      return pd !== 0 ? pd : a.createdAt - b.createdAt;
    });
  }

  async #persist(): Promise<void> {
    try {
      await this.#store.setItem(STORE_KEY, this.#queue);
    } catch {}
  }
}