import { Router }               from 'express';
import { requireAuth as authenticate } from '../../../core/middleware/auth.middleware.js';
import { PaymentController }    from '../controllers/PaymentController.js';
import { RefundController }     from '../controllers/RefundController.js';
import { SubscriptionController } from '../controllers/SubscriptionController.js';
import { AnalyticsController }  from '../controllers/AnalyticsController.js';
import { WebhookController }    from '../controllers/WebhookController.js';

const router = Router();

// Webhooks (no auth — provider-signed)
router.post('/webhooks/:provider', WebhookController.receive);

// Auth required for all below
router.use(authenticate);

// Payment intents
router.post('/',                           PaymentController.createIntent);
router.get('/',                            PaymentController.listIntents);
router.get('/:id',                         PaymentController.getIntent);
router.post('/:id/confirm',                PaymentController.confirmIntent);

// 3D Secure
router.post('/:id/3ds/initiate',           PaymentController.initiate3DS);
router.post('/3ds/:sessionId/verify',      PaymentController.verify3DS);

// Refunds
router.post('/refunds',                    RefundController.request);
router.post('/refunds/:id/approve',        RefundController.approve);

// Subscriptions
router.post('/subscriptions',              SubscriptionController.create);
router.get('/subscriptions',               SubscriptionController.list);
router.post('/subscriptions/:id/cancel',   SubscriptionController.cancel);
router.post('/subscriptions/:id/renew',    SubscriptionController.renew);

// Analytics
router.get('/analytics/metrics',           AnalyticsController.getMetrics);
router.get('/analytics/revenue',           AnalyticsController.getRevenue);
router.get('/analytics/my',                AnalyticsController.getMyMetrics);

export default router;
