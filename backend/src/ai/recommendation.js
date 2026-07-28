/**
 * AI — Recommendation Engine
 * Scores workers/jobs using profile similarity, rating, distance, and availability
 */
import { supabase } from '../config/supabaseClient.js';
import { withCache, cache } from '../core/cache.js';

const W_RATING      = 0.35;
const W_MATCH       = 0.30;
const W_DISTANCE    = 0.20;
const W_EXPERIENCE  = 0.15;

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function categoryMatch(workerCat, jobCat) {
  if (!workerCat || !jobCat) return 0.5;
  if (workerCat === jobCat) return 1.0;
  // Same first word (e.g. "tech" in "tech_web" and "tech_mobile")
  if (workerCat.split('_')[0] === jobCat.split('_')[0]) return 0.7;
  return 0.2;
}

function scoreWorker(worker, job, jobLocation) {
  const rating     = ((worker.stats?.rating || 3) / 5) * W_RATING;
  const match      = categoryMatch(worker.category, job.category) * W_MATCH;
  const experience = Math.min((worker.profileMetadata?.yearsExperience || 0) / 10, 1) * W_EXPERIENCE;

  let distScore = 0.5;
  if (jobLocation?.lat && worker.location?.lat) {
    const km = haversineKm(jobLocation.lat, jobLocation.lon, worker.location.lat, worker.location.lon);
    distScore = Math.max(0, 1 - km / 50); // 50km radius baseline
  }

  return rating + match + (distScore * W_DISTANCE) + experience;
}

// Recommend top workers for a job
export async function recommendWorkers(jobId, limit = 10) {
  const cacheKey = `rec:workers:${jobId}:${limit}`;
  return withCache(cache.short, cacheKey, async () => {
    const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single();
    if (!job) return [];

    const { data: workers } = await supabase
      .from('profiles')
      .select('id,name,category,location,stats,profileMetadata,isAvailable')
      .eq('role', 'worker')
      .eq('is_available', true)
      .limit(200);

    if (!workers?.length) return [];

    return workers
      .map(w => ({ ...w, _score: scoreWorker(w, job, job.location) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, limit)
      .map(w => ({ ...w, relevanceScore: Math.round(w._score * 100) }));
  }, 60_000);
}

// Recommend jobs for a worker
export async function recommendJobs(workerId, limit = 10) {
  const cacheKey = `rec:jobs:${workerId}:${limit}`;
  return withCache(cache.short, cacheKey, async () => {
    const { data: worker } = await supabase.from('profiles').select('*').eq('id', workerId).single();
    if (!worker) return [];

    const { data: jobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!jobs?.length) return [];

    return jobs
      .map(j => ({ ...j, _score: categoryMatch(worker.category, j.category) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, limit);
  }, 60_000);
}

// Trending categories based on recent job postings
export async function trendingCategories(limit = 8) {
  return withCache(cache.long, `rec:trending:${limit}`, async () => {
    const { data } = await supabase
      .from('jobs')
      .select('category')
      .gte('created_at', new Date(Date.now() - 7 * 86400_000).toISOString())
      .limit(500);

    if (!data?.length) return [];
    const counts = {};
    data.forEach(({ category }) => { if (category) counts[category] = (counts[category] || 0) + 1; });
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([category, count]) => ({ category, count }));
  }, 30 * 60_000);
}

export default { recommendWorkers, recommendJobs, trendingCategories };
