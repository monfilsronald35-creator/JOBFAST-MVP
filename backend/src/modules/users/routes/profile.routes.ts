import { Router } from 'express';
import { ProfileController } from '../controllers/ProfileController.js';
import { VerificationController } from '../controllers/VerificationController.js';
import { ReputationController } from '../controllers/ReputationController.js';
import { AvailabilityController } from '../controllers/AvailabilityController.js';
import { AnalyticsController } from '../controllers/AnalyticsController.js';
import { requireAuth, requireRole } from '../../../core/middleware/auth.middleware.js';

export function createProfileRouter(): Router {
  const r = Router();

  // ——— My profile ————————————————————————————————————————————————————————
  r.get('/me/profile',          requireAuth, ProfileController.getMyProfile);
  r.patch('/me/profile',        requireAuth, ProfileController.updateMyProfile);
  r.get('/me/privacy',          requireAuth, ProfileController.getMyPrivacy);
  r.patch('/me/privacy',        requireAuth, ProfileController.updateMyPrivacy);

  // ——— Availability ——————————————————————————————————————————————————————
  r.get('/me/availability',     requireAuth, AvailabilityController.get);
  r.put('/me/availability',     requireAuth, AvailabilityController.set);

  // ——— Verifications ————————————————————————————————————————————————————
  r.get('/me/verifications',    requireAuth, VerificationController.getAll);
  r.post('/me/verifications',   requireAuth, VerificationController.submit);

  // ——— Documents ————————————————————————————————————————————————————————
  r.get('/me/documents',        requireAuth, VerificationController.listDocuments);
  r.post('/me/documents',       requireAuth, VerificationController.uploadDocument);
  r.delete('/me/documents/:docId', requireAuth, VerificationController.deleteDocument);

  // ——— Reputation ———————————————————————————————————————————————————————
  r.get('/me/reputation',       requireAuth, ReputationController.getMyReputation);
  r.post('/me/profile/analyze', requireAuth, ReputationController.analyzeProfile);
  r.post('/reviews',            requireAuth, ReputationController.addReview);

  // ——— Analytics ————————————————————————————————————————————————————————
  r.get('/me/analytics',        requireAuth, AnalyticsController.getMyAnalytics);

  // ——— Public endpoints —————————————————————————————————————————————————
  r.get('/search',                        ProfileController.searchProfiles);
  r.get('/:username/profile',             ProfileController.getPublicProfile);
  r.get('/:userId/reputation',            ReputationController.getUserReputation);
  r.get('/:userId/reviews',               ReputationController.listReviews);

  // ——— Admin ————————————————————————————————————————————————————————————
  r.post('/admin/verifications/review', requireAuth, requireRole('admin', 'superadmin'), VerificationController.review);

  return r;
}
