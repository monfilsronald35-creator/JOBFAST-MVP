import type { Request, Response, NextFunction } from 'express';
import { ProfileService } from '../services/ProfileService.js';
import { ProfileAnalyticsService } from '../services/ProfileAnalyticsService.js';
import { PrivacyService } from '../services/PrivacyService.js';

export const ProfileController = {
  getMyProfile: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profile = await ProfileService.getProfile(req.user!.sub);
      res.json({ success: true, data: profile });
    } catch (err) { next(err); }
  },

  updateMyProfile: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const updated = await ProfileService.createOrUpdate(req.user!.sub, req.body as Record<string, unknown>);
      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  },

  getPublicProfile: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username } = req.params as { username: string };
      const profile = await ProfileService.getPublicProfile(username);
      const privacy = await PrivacyService.get(profile.userId);
      const filtered = PrivacyService.applyFilter(profile as unknown as Record<string, unknown>, privacy, req.user?.sub);
      await ProfileAnalyticsService.trackView(profile.userId, req.user?.sub, 'profile_page');
      res.json({ success: true, data: filtered });
    } catch (err) { next(err); }
  },

  searchProfiles: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.query as Record<string, string | undefined>;
      const searchQuery: Parameters<typeof ProfileService.search>[0] = {};
      if (q['skills'])      searchQuery.skills      = q['skills'].split(',').filter(Boolean);
      if (q['industry'])    searchQuery.industry    = q['industry'];
      if (q['profileType']) searchQuery.profileType = q['profileType'];
      if (q['country'])     searchQuery.country     = q['country'];
      if (q['limit'])       searchQuery.limit       = parseInt(q['limit'], 10);
      if (q['cursor'])      searchQuery.cursor      = q['cursor'];
      const results = await ProfileService.search(searchQuery);
      res.json({ success: true, data: results, count: results.length });
    } catch (err) { next(err); }
  },

  getMyPrivacy: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await PrivacyService.get(req.user!.sub);
      res.json({ success: true, data: settings });
    } catch (err) { next(err); }
  },

  updateMyPrivacy: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const settings = await PrivacyService.update(req.user!.sub, req.body as Record<string, unknown>);
      res.json({ success: true, data: settings });
    } catch (err) { next(err); }
  },
};
