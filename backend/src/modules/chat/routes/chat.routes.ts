import { Router }                 from 'express';
import { requireAuth }            from '../../../core/middleware/auth.middleware.js';
import { RoomController }         from '../controllers/RoomController.js';
import { MessageController }      from '../controllers/MessageController.js';
import { PresenceController }     from '../controllers/PresenceController.js';
import { CallController }         from '../controllers/CallController.js';
import { ChatAnalyticsController } from '../controllers/AnalyticsController.js';

const router = Router();

router.use(requireAuth);

// ── Rooms ─────────────────────────────────────────────────────────────────────
router.post('/rooms/direct',                 RoomController.createDirect);
router.post('/rooms/group',                  RoomController.createGroup);
router.post('/rooms/channel',                RoomController.createChannel);
router.get('/rooms',                         RoomController.list);
router.get('/rooms/:id',                     RoomController.get);
router.patch('/rooms/:id',                   RoomController.update);

// Members
router.post('/rooms/:id/members',            RoomController.addMember);
router.delete('/rooms/:id/members/:userId',  RoomController.removeMember);
router.get('/rooms/:id/members',             RoomController.listMembers);

// ── Messages ──────────────────────────────────────────────────────────────────
router.post('/rooms/:roomId/messages',                   MessageController.send);
router.get('/rooms/:roomId/messages',                    MessageController.list);
router.patch('/rooms/:roomId/messages/:id',              MessageController.edit);
router.delete('/rooms/:roomId/messages/:id',             MessageController.delete);
router.post('/rooms/:roomId/messages/:id/react',         MessageController.react);
router.post('/rooms/:roomId/messages/:id/translate',     MessageController.translate);

// Pins
router.get('/rooms/:roomId/pins',                        MessageController.getPinned);
router.post('/rooms/:roomId/pins/:id',                   MessageController.pin);
router.delete('/rooms/:roomId/pins/:id',                 MessageController.unpin);

// Search
router.get('/search',                                    MessageController.search);

// ── Presence ──────────────────────────────────────────────────────────────────
router.get('/presence/:userId',              PresenceController.getPresence);
router.post('/presence/bulk',                PresenceController.getBulkPresence);
router.patch('/presence/status',             PresenceController.setStatus);
router.get('/rooms/:roomId/typing',          PresenceController.getTyping);

// ── Calls ─────────────────────────────────────────────────────────────────────
router.post('/rooms/:roomId/calls',          CallController.initiate);
router.get('/calls/:id',                     CallController.getCall);
router.post('/calls/:id/answer',             CallController.answer);
router.post('/calls/:id/end',                CallController.end);
router.post('/calls/:id/decline',            CallController.decline);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get('/analytics',                     ChatAnalyticsController.getMetrics);
router.get('/rooms/:roomId/analytics',       ChatAnalyticsController.getRoomStats);

export default router;
