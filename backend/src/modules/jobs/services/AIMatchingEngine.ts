import { JobRepository } from '../repositories/JobRepository.js';
import { ApplicationRepository } from '../repositories/ApplicationRepository.js';
import { AppError } from '../../../core/errors/AppError.js';
import type { JobMatchScore, JobPosting } from '../types/job.types.js';

interface WorkerProfile {
  userId:          string;
  skills:          string[];
  experienceYears: number;
  languages:       string[];
  salaryExpectMin?: number;
  reputationScore?: number;
  availabilityStatus?: string;
  lat?:            number;
  lng?:            number;
}

function clamp(n: number): number { return Math.max(0, Math.min(100, n)); }

function skillOverlap(jobSkills: string[], workerSkills: string[]): number {
  if (!jobSkills.length) return 100;
  const jobSet = new Set(jobSkills.map(s => s.toLowerCase()));
  const matches = workerSkills.filter(s => jobSet.has(s.toLowerCase())).length;
  return clamp((matches / jobSkills.length) * 100);
}

function expScore(jobYears: number | undefined, workerYears: number): number {
  if (!jobYears) return 80;
  if (workerYears >= jobYears) return 100;
  return clamp((workerYears / jobYears) * 100);
}

function langScore(jobLangs: string[], workerLangs: string[]): number {
  if (!jobLangs.length) return 100;
  const wSet = new Set(workerLangs.map(l => l.toLowerCase()));
  const matches = jobLangs.filter(l => wSet.has(l.toLowerCase())).length;
  return clamp((matches / jobLangs.length) * 100);
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distScore(job: JobPosting, worker: WorkerProfile): number {
  if (job.isRemoteOk || job.workMode === 'remote') return 100;
  if (!job.lat || !job.lng || !worker.lat || !worker.lng) return 70;
  const km = distanceKm(job.lat, job.lng, worker.lat, worker.lng);
  if (km <= 5)  return 100;
  if (km <= 20) return 90;
  if (km <= 50) return 70;
  if (km <= 100) return 50;
  return 20;
}

function salaryScore(job: JobPosting, worker: WorkerProfile): number {
  if (!worker.salaryExpectMin || !job.salaryMax) return 75;
  if (worker.salaryExpectMin <= job.salaryMax) return 100;
  const ratio = job.salaryMax / worker.salaryExpectMin;
  return clamp(ratio * 100);
}

function availScore(status: string | undefined): number {
  if (!status || status === 'available' || status === 'online') return 100;
  if (status === 'busy')    return 50;
  if (status === 'offline') return 70;
  return 60;
}

export const AIMatchingEngine = {
  async computeScore(jobId: string, worker: WorkerProfile): Promise<JobMatchScore> {
    const job = await JobRepository.findById(jobId);
    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');

    const scores = {
      skillsScore: skillOverlap(job.skills, worker.skills),
      expScore:    expScore(job.experienceYears, worker.experienceYears),
      distScore:   distScore(job, worker),
      salaryScore: salaryScore(job, worker),
      langScore:   langScore(job.languages, worker.languages),
      availScore:  availScore(worker.availabilityStatus),
      repScore:    clamp(worker.reputationScore ?? 60),
    };

    const matchScore = clamp(
      scores.skillsScore * 0.30 +
      scores.expScore    * 0.20 +
      scores.distScore   * 0.15 +
      scores.salaryScore * 0.15 +
      scores.langScore   * 0.10 +
      scores.availScore  * 0.05 +
      scores.repScore    * 0.05,
    );

    const result = await JobRepository.saveMatchScore({
      jobId,
      workerId:    worker.userId,
      matchScore:  Math.round(matchScore),
      skillsScore: Math.round(scores.skillsScore),
      expScore:    Math.round(scores.expScore),
      distScore:   Math.round(scores.distScore),
      salaryScore: Math.round(scores.salaryScore),
      langScore:   Math.round(scores.langScore),
      availScore:  Math.round(scores.availScore),
      repScore:    Math.round(scores.repScore),
      breakdown:   scores,
      computedAt:  new Date().toISOString(),
    });

    // attach match score to any pending application
    const app = await ApplicationRepository.findByJobAndApplicant(jobId, worker.userId);
    if (app) await ApplicationRepository.setMatchScore(app.id, matchScore);

    return result;
  },

  async getTopCandidates(jobId: string, limit = 20): Promise<JobMatchScore[]> {
    const job = await JobRepository.findById(jobId);
    if (!job) throw new AppError('Job not found', 404, 'JOB_NOT_FOUND');
    return JobRepository.getTopMatchesForWorker(jobId);
  },

  async getRecommendedJobs(worker: WorkerProfile, limit = 10): Promise<JobMatchScore[]> {
    return JobRepository.getTopMatchesForWorker(worker.userId, limit);
  },
};
