/**
 * Token bucket rate limiter.
 * Tokens refill at `rate` per second, capped at `burst`.
 * Each emit consumes one token; excess events are queued or dropped.
 */

export interface RateLimiterConfig {
  readonly eventsPerSecond: number;
  readonly burstSize: number;
}

export type RateLimiterAction = 'allow' | 'queue' | 'drop';

export interface RateLimiterResult {
  readonly action: RateLimiterAction;
  readonly waitMs: number;
  readonly tokensRemaining: number;
}

export class RateLimiter {
  readonly #rate: number;
  readonly #burst: number;
  #tokens: number;
  #lastRefill: number;
  #dropped = 0;
  #queued = 0;

  constructor(config: RateLimiterConfig) {
    this.#rate = config.eventsPerSecond;
    this.#burst = config.burstSize;
    this.#tokens = config.burstSize;
    this.#lastRefill = Date.now();
  }

  check(priority: 'critical' | 'high' | 'normal' | 'low' = 'normal'): RateLimiterResult {
    this.#refill();

    if (this.#tokens >= 1) {
      this.#tokens -= 1;
      return { action: 'allow', waitMs: 0, tokensRemaining: this.#tokens };
    }

    const waitMs = Math.ceil((1 - this.#tokens) / this.#rate * 1_000);

    if (priority === 'critical' || priority === 'high') {
      this.#queued++;
      return { action: 'queue', waitMs, tokensRemaining: this.#tokens };
    }

    if (priority === 'normal' && this.#queued < 50) {
      this.#queued++;
      return { action: 'queue', waitMs, tokensRemaining: this.#tokens };
    }

    this.#dropped++;
    return { action: 'drop', waitMs, tokensRemaining: this.#tokens };
  }

  consume(): boolean {
    this.#refill();
    if (this.#tokens < 1) return false;
    this.#tokens -= 1;
    return true;
  }

  get stats() {
    return {
      tokens: this.#tokens,
      burst: this.#burst,
      rate: this.#rate,
      dropped: this.#dropped,
      queued: this.#queued,
    };
  }

  reset(): void {
    this.#tokens = this.#burst;
    this.#lastRefill = Date.now();
    this.#dropped = 0;
    this.#queued = 0;
  }

  #refill(): void {
    const now = Date.now();
    const elapsed = (now - this.#lastRefill) / 1_000;
    this.#tokens = Math.min(this.#burst, this.#tokens + elapsed * this.#rate);
    this.#lastRefill = now;
  }
}