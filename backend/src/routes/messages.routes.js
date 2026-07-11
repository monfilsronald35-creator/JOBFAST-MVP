import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import {
  getConversations,
  getMessages,
  sendMessage,
  markRead,
  startConversation,
} from '../controllers/messages.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/conversations',           getConversations);
router.post('/start',                  startConversation);
router.get('/:conversationId',         getMessages);
router.post('/',                       sendMessage);
router.patch('/:conversationId/read',  markRead);

export default router;
