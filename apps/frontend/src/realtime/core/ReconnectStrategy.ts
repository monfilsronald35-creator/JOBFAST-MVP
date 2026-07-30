/**
 * Exponential backoff reconnect strategy with full jitter.
 * Full jitter: delay = random(0, min(cap, base * 2^attempt))
 * Prevents thundering herd when many clients reconnect simultaneously.
 */

export interface ReconnectConfig {
  readonly maxAttempts: number;
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
  readonly jitterFactor: number; // 0–1
}

const DEFAULTS: ReconnectConfig = {
  maxAttempts: 15,
  initialDelayMs: 1_000,
  maxDelayMs: 30_000,
  jitterFactor: 0.5,
};

export class ReconnectStrategy {
  readonly #config: ReconnectConfig;
  #attempt = 0;
  #aborted = false;
  #timer: ReturnType<typeof setTimeout> | null = null;
  #onAttempt: ((attempt: number, delay: number) => void) | null = null;
  #onGiveUp: (() => void) | null = null;

  constructor(config: Partial<ReconnectConfig> = {}) {
    this.#config = { ...DEFAULTS, ...config };
  }

  get attempt(): number { return this.#attempt; }
  get exhausted(): boolean { return this.#attempt >= this.#config.maxAttempts; }

  onAttempt(fn: (attempt: number, delay: number) => void): this {
    this.#onAttempt = fn;
    return this;
  }

  onGiveUp(fn: () => void): this {
    this.#onGiveUp = fn;
    return this;
  }

  schedule(fn: () => void): void {
    if (this.#aborted) return;
    if (this.#attempt >= this.#config.maxAttempts) {
      this.#onGiveUp?.();
      return;
    }

    const delay = this.#nextDelay();
    this.#onAttempt?.(this.#attempt + 1, delay);

    this.#timer = setTimeout(() => {
      if (!this.#aborted) {
        this.#attempt++;
        fn();
      }
    }, delay);
  }

  reset(): void {
    this.#attempt = 0;
    this.#clearTimer();
  }

  abort(): void {
    this.#aborted = true;
    this.#clearTimer();
  }

  resume(): void {
    this.#aborted = false;
  }

  #nextDelay(): number {
    const { initialDelayMs, maxDelayMs, jitterFactor } = this.#config;
    const exponential = Math.min(initialDelayMs * 2 ** this.#attempt, maxDelayMs);
    const jitter = exponential * jitterFactor * Math.random();
    return Math.floor(exponential - jitter);
  }

  #clearTimer(): void {
    if (this.#timer !== null) {
      clearTimeout(this.#timer);
      this.#timer = null;
    }
  }
}