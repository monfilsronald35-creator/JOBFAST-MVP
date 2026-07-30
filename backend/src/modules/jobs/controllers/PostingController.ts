import type { Request, Response, NextFunction } from 'express';
import { PostingService as JobService } from '../services/PostingService.js';
import { AIMatchingEngine } from '../services/AIMatchingEngine.js';
import { JobType, WorkMode, type JobSearchQuery } from '../types/job.types.js';

export const PostingController = {
  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as Record<string, unknown>;
      const posting = await JobService.create(req.user!.sub, {
        title:       body['title'] as string,
        description: body['description'] as string,
        skills:      (body['skills'] as string[]) ?? [],
        languages:   (body['languages'] as string[]) ?? [],
        currency:    (body['currency'] as string) ?? 'HTG',
        benefits:    (body['benefits'] as string[]) ?? [],
        industry:    body['industry'] as string,
        jobType:     (body['jobType'] as JobType) ?? JobType.FullTime,
        workMode:    (body['workMode'] as WorkMode) ?? WorkMode.OnSite,
        positions:   (body['positions'] as number) ?? 1,
        status:      'draft' as never,
        isUrgent:    Boolean(body['isUrgent']),
        isVerified:  false,
        isSponsored: Boolean(body['isSponsored']),
        isInternational: Boolean(body['isInternational']),
        isRemoteOk:  Boolean(body['isRemoteOk']),
        ...body,
      });
      res.status(201).json({ success: true, data: posting });
    } catch (err) { next(err); }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const posting = await JobService.getById(id);
      await JobService.trackView(id);
      res.json({ success: true, data: posting });
    } catch (err) { next(err); }
  },

  update: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const posting = await JobService.update(id, req.user!.sub, req.body as never);
      res.json({ success: true, data: posting });
    } catch (err) { next(err); }
  },

  publish: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const posting = await JobService.publish(id, req.user!.sub);
      res.json({ success: true, data: posting });
    } catch (err) { next(err); }
  },

  close: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const posting = await JobService.close(id, req.user!.sub);
      res.json({ success: true, data: posting });
    } catch (err) { next(err); }
  },

  myPostings: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.query as Record<string, string | undefined>;
      const postings = await JobService.listByEmployer(req.user!.sub, status as never);
      res.json({ success: true, data: postings, count: postings.length });
    } catch (err) { next(err); }
  },

  search: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.query as Record<string, string | undefined>;
      const query: JobSearchQuery = {};
      if (q['industry'])    query.industry    = q['industry'];
      if (q['jobType'])     query.jobType     = q['jobType'];
      if (q['workMode'])    query.workMode    = q['workMode'];
      if (q['country'])     query.country     = q['country'];
      if (q['city'])        query.city        = q['city'];
      if (q['skills'])      query.skills      = q['skills'].split(',').filter(Boolean);
      if (q['salaryMin'])   query.salaryMin   = parseInt(q['salaryMin'], 10);
      if (q['salaryMax'])   query.salaryMax   = parseInt(q['salaryMax'], 10);
      if (q['isUrgent'])    query.isUrgent    = q['isUrgent'] === 'true';
      if (q['isRemoteOk'])  query.isRemoteOk  = q['isRemoteOk'] === 'true';
      if (q['isVerified'])  query.isVerified  = q['isVerified'] === 'true';
      if (q['limit'])       query.limit       = parseInt(q['limit'], 10);
      if (q['cursor'])      query.cursor      = q['cursor'];
      const results = await JobService.search(query);
      res.json({ success: true, data: results, count: results.length });
    } catch (err) { next(err); }
  },

  getMatchScore: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const score = await JobRepository_getScore(id, req.user!.sub);
      res.json({ success: true, data: score });
    } catch (err) { next(err); }
  },

  getTopCandidates: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const { limit } = req.query as { limit?: string };
      const candidates = await AIMatchingEngine.getTopCandidates(id, limit ? parseInt(limit, 10) : 20);
      res.json({ success: true, data: candidates });
    } catch (err) { next(err); }
  },

  getRecommended: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const jobs = await AIMatchingEngine.getRecommendedJobs({ userId: req.user!.sub, skills: [], experienceYears: 0, languages: [] });
      res.json({ success: true, data: jobs });
    } catch (err) { next(err); }
  },
};

async function JobRepository_getScore(jobId: string, workerId: string) {
  const { JobRepository } = await import('../repositories/JobRepository.js');
  return JobRepository.getMatchScore(jobId, workerId);
}
