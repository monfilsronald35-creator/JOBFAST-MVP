/**
 * Infrastructure — Background Jobs
 * Cron-like scheduled tasks that run within the Node process
 * For production scale: migrate to Render cron jobs or Bull + Redis
 */
import { supabase } from '../config/supabaseClient.js';
import { cache } from '../core/cache.js';
import { analytics } from '../core/analytics.js';
import { queues } from './queue.js';

const jobs = new Map();
let started = false;

function schedule(name, intervalMs, handler) {
  if (jobs.has(name)) clearInterval(jobs.get(name));
  const id = setInterval(async () => {
    try { await handler(); } catch (e) { console.error(`[BackgroundJob] ${name} failed:`, e?.message); }
  }, intervalMs);
  id.unref(); // Don't prevent process exit
  jobs.set(name, id);
}

// ── Job Definitions ───────────────────────────────────────────────────────

// Flush analytics every 10 seconds
async function flushAnalytics() {
  await analytics._flush();
}

// Clean completed queue jobs every hour
async function cleanQueues() {
  await Promise.all(Object.values(queues).map(q => q.clean()));
}

// Expire stale "pending" payments (> 1 hour) every 15 minutes
async function expireStalePayments() {
  const cutoff = new Date(Date.now() - 60 * 60_000).toISOString();
  await supabase
    .from('payments')
    .update({ status: 'expired' })
    .eq('status', 'pending')
    .lt('created_at', cutoff);
}

// Auto-close jobs that have been open > 30 days
async function autoCloseOldJobs() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();
  await supabase
    .from('jobs')
    .update({ status: 'expired' })
    .eq('status', 'open')
    .lt('created_at', cutoff);
}

// Warm up popular caches (community members, categories)
async function warmCaches() {
  // Just invalidate stale entries; cache.medium will repopulate on next request
  cache.short.invalidatePrefix('search:');
}

// ── Startup ───────────────────────────────────────────────────────────────

export function startBackgroundJobs() {
  if (started) return;
  started = true;

  schedule('flush_analytics',      10_000,       flushAnalytics);
  schedule('clean_queues',         60 * 60_000,  cleanQueues);
  schedule('expire_payments',      15 * 60_000,  expireStalePayments);
  schedule('auto_close_jobs',      6 * 60 * 60_000, autoCloseOldJobs);
  schedule('warm_caches',          5 * 60_000,   warmCaches);

  console.log('[BackgroundJobs] Started 5 scheduled jobs');
}

export function stopBackgroundJobs() {
  for (const [name, id] of jobs) {
    clearInterval(id);
    jobs.delete(name);
  }
  started = false;
}

export default { startBackgroundJobs, stopBackgroundJobs };
