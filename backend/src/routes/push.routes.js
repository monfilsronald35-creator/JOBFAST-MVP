import express from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { subscribePush, unsubscribePush, getVapidKey, sendPushToAll, sendPushToOne } from '../controllers/push.controller.js';

const router = express.Router();

// Public — frontend needs the public key before it can subscribe
router.get('/vapid-key', getVapidKey);

// Authenticated — manage subscriptions
router.post('/subscribe',   authMiddleware, subscribePush);
router.post('/unsubscribe', authMiddleware, unsubscribePush);

// Admin — send pushes
router.post('/send-all', authMiddleware, sendPushToAll);
router.post('/send-one', authMiddleware, sendPushToOne);

export default router;
