import { Router }               from 'express';
import { requireAuth }           from '../../../core/middleware/auth.middleware.js';
import { ExperienceController }  from '../controllers/ExperienceController.js';

export const aiExperienceRouter = Router();

// ── Experience Load (first screen after login) ─────────────────────────────
aiExperienceRouter.get('/experience/load',        requireAuth, ExperienceController.load);

// ── Daily Briefing ─────────────────────────────────────────────────────────
aiExperienceRouter.get('/experience/briefing',    requireAuth, ExperienceController.getBriefing);
aiExperienceRouter.delete('/experience/briefing', requireAuth, ExperienceController.invalidateBriefing);

// ── Smart Home ─────────────────────────────────────────────────────────────
aiExperienceRouter.get('/experience/home',        requireAuth, ExperienceController.getHome);

// ── Opportunities ──────────────────────────────────────────────────────────
aiExperienceRouter.get('/experience/opportunities',          requireAuth, ExperienceController.listOpportunities);
aiExperienceRouter.post('/experience/opportunities/discover',requireAuth, ExperienceController.discoverOpportunities);
aiExperienceRouter.delete('/experience/opportunities/:id',   requireAuth, ExperienceController.dismissOpportunity);

// ── City Intelligence ──────────────────────────────────────────────────────
aiExperienceRouter.get('/experience/city',        requireAuth, ExperienceController.cityDashboard);

// ── Travel Concierge ───────────────────────────────────────────────────────
aiExperienceRouter.get('/experience/travel',      requireAuth, ExperienceController.getTravelPlan);

// ── Business Concierge ─────────────────────────────────────────────────────
aiExperienceRouter.get('/experience/business',    requireAuth, ExperienceController.getBusinessKPIs);

// ── Preferences ────────────────────────────────────────────────────────────
aiExperienceRouter.get('/experience/preferences',  requireAuth, ExperienceController.getPreferences);
aiExperienceRouter.put('/experience/preferences',  requireAuth, ExperienceController.updatePreferences);

// ── Experience Score ───────────────────────────────────────────────────────
aiExperienceRouter.get('/experience/score',        requireAuth, ExperienceController.getScore);