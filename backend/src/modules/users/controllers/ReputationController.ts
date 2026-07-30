import type { Request, Response, NextFunction } from 'express';
import { ReputationEngine } from '../services/ReputationEngine.js';
import { AIProfileEngine } from '../services/AIProfileEngine.js';
import { AppError } from '../../../core/errors/AppError.js';

export const ReputationController = {
  getMyReputation: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [score, aiScore] = await Promise.all([
        ReputationEngine.get(req.user!.sub),
        AIProfileEngine.getCached(req.user!.sub),
      ]);
      res.json({ success: true, data: { reputation: score, ai: aiScore } });
    } catch (err) { next(err); }
  },

  getUserReputation: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params as { userId: string };
      const score = await ReputationEngine.get(userId);
      if (!score) throw new AppError('Reputation not found', 404, 'NOT_FOUND');
      res.json({ success: true, data: score });
    } catch (err) { next(err); }
  },

  addReview: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as { userId: string; rating: number; comment?: string; context?: string; contextId?: string; isVerified?: boolean };
      if (req.user!.sub === body.userId) throw new AppError('Cannot review yourself', 400, 'SELF_REVIEW');
      if (!body.rating || body.rating < 1 || body.rating > 5) throw new AppError('Rating must be 1–5', 400, 'INVALID_RATING');

      type AddReviewArg = Parameters<typeof ReputationEngine.addReview>[0];
      const base: AddReviewArg = {
        userId:     body.userId,
        reviewerId: req.user!.sub,
        rating:     body.rating,
        context:    (body.context ?? 'general') as AddReviewArg['context'],
        isVerified: body.isVerified ?? false,
      };
      if (body.comment)   (base as Record<string, unknown>)['comment']   = body.comment;
      if (body.contextId) (base as Record<string, unknown>)['contextId'] = body.contextId;

      const review = await ReputationEngine.addReview(base);
      res.status(201).json({ success: true, data: review });
    } catch (err) { next(err); }
  },

  listReviews: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params as { userId: string };
      const { limit } = req.query as { limit?: string };
      const reviews = await ReputationEngine.listReviews(userId, limit ? parseInt(limit, 10) : 20);
      res.json({ success: true, data: reviews, count: reviews.length });
    } catch (err) { next(err); }
  },

  analyzeProfile: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const score = await AIProfileEngine.analyze(req.user!.sub);
      res.json({ success: true, data: score });
    } catch (err) { next(err); }
  },
};
