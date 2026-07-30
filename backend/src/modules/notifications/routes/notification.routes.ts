import { Router }                   from 'express';
import { requireAuth as authenticate } from '../../../core/middleware/auth.middleware.js';
import { NotificationController }   from '../controllers/NotificationController.js';
import { PreferenceController }     from '../controllers/PreferenceController.js';
import { AnalyticsController }      from '../controllers/AnalyticsController.js';
import { EnterpriseController }     from '../controllers/EnterpriseController.js';

const router = Router();

// ── Notifications ─────────────────────────────────────────────────────────────
router.get('/',                     authenticate, NotificationController.list);
router.get('/unread-count',         authenticate, NotificationController.getUnreadCount);
router.post('/:id/read',            authenticate, NotificationController.markRead);
router.post('/read-all',            authenticate, NotificationController.markAllRead);
router.delete('/:id',               authenticate, NotificationController.cancel);

// ── Preferences ───────────────────────────────────────────────────────────────
router.get('/preferences',          authenticate, PreferenceController.list);
router.put('/preferences',          authenticate, PreferenceController.update);
router.put('/preferences/quiet-hours', authenticate, PreferenceController.setQuietHours);

// ── Analytics (admin) ─────────────────────────────────────────────────────────
router.get('/analytics/channels',   authenticate, AnalyticsController.channelStats);
router.get('/analytics/daily',      authenticate, AnalyticsController.dailyStats);
router.get('/analytics/top-events', authenticate, AnalyticsController.topEvents);

// ── Enterprise ────────────────────────────────────────────────────────────────
router.post('/campaigns',           authenticate, EnterpriseController.createCampaign);
router.post('/campaigns/broadcast', authenticate, EnterpriseController.broadcast);
router.get('/campaigns',            authenticate, EnterpriseController.listCampaigns);

export default router;