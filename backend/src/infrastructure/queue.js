/**
 * Infrastructure — Message Queue
 * In-memory queue with Bull-compatible interface; swap for Bull/BullMQ when Redis is available
 */
import { EventEmitter } from 'events';

class InMemoryQueue extends EventEmitter {
  constructor(name) {
    super();
    this.name      = name;
    this._jobs     = new Map();
    this._handlers = new Map();
    this._counter  = 0;
    this._running  = 0;
    this._concurrency = 5;
  }

  async add(jobName, data, options = {}) {
    const id  = ++this._counter;
    const job = {
      id,
      name:  jobName,
      data,
      opts:  options,
      state: 'waiting',
      addedAt:  Date.now(),
      delay:    options.delay || 0,
      attempts: 0,
      maxAttempts: options.attempts || 3,
    };
    this._jobs.set(id, job);

    const run = () => {
      if (this._running < this._concurrency) this._process(id);
    };

    if (job.delay > 0) setTimeout(run, job.delay).unref();
    else               setImmediate(run);

    return job;
  }

  process(jobName, concurrency, handler) {
    if (typeof concurrency === 'function') { handler = concurrency; concurrency = 1; }
    this._handlers.set(jobName, handler);
    this._concurrency = concurrency;
  }

  async _process(id) {
    const job = this._jobs.get(id);
    if (!job || job.state !== 'waiting') return;

    const handler = this._handlers.get(job.name);
    if (!handler) return;

    job.state = 'active';
    job.attempts++;
    this._running++;

    try {
      const result = await handler(job);
      job.state     = 'completed';
      job.result    = result;
      job.finishedAt = Date.now();
      this.emit('completed', job, result);
    } catch (err) {
      job.failedReason = err.message;
      if (job.attempts < job.maxAttempts) {
        job.state = 'waiting';
        const backoff = Math.min(1000 * 2 ** job.attempts, 30_000);
        setTimeout(() => this._process(id), backoff).unref();
      } else {
        job.state = 'failed';
        this.emit('failed', job, err);
      }
    } finally {
      this._running--;
    }
  }

  getJobCounts() {
    const counts = { waiting: 0, active: 0, completed: 0, failed: 0 };
    for (const job of this._jobs.values()) counts[job.state] = (counts[job.state] || 0) + 1;
    return counts;
  }

  async clean() {
    const cutoff = Date.now() - 60 * 60_000;
    for (const [id, job] of this._jobs) {
      if (['completed', 'failed'].includes(job.state) && job.finishedAt < cutoff) this._jobs.delete(id);
    }
  }
}

// Named queues
export const queues = {
  notifications: new InMemoryQueue('notifications'),
  emails:        new InMemoryQueue('emails'),
  analytics:     new InMemoryQueue('analytics'),
  imageProcess:  new InMemoryQueue('image_process'),
  payments:      new InMemoryQueue('payments'),
};

// Register default processors
queues.notifications.process('send', 10, async job => {
  // Handled by notificationEngine
  return { sent: true };
});

queues.emails.process('send', 5, async job => {
  // TODO: integrate SendGrid / Mailgun
  // await emailService.send(job.data);
  return { sent: true };
});

queues.imageProcess.process('resize', 3, async job => {
  // TODO: integrate sharp / Supabase transform
  return { processed: true };
});

export default queues;
