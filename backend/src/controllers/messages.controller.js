import messageRepo from '../repositories/message.repository.js';
import userRepo    from '../repositories/user.repository.js';
import { getIO }   from '../utils/io.js';

/**
 * GET /messages/conversations
 */
export async function getConversations(req, res) {
  try {
    const me = String(req.user._id || req.user.id);
    const conversations = await messageRepo.getConversations(me);
    res.json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /messages/:conversationId
 */
export async function getMessages(req, res) {
  try {
    const me     = String(req.user._id || req.user.id);
    const convId = req.params.conversationId;
    const limit  = Math.min(Number(req.query.limit) || 30, 100);
    const cursor = req.query.cursor || null;

    // Verify the requesting user is part of this conversation
    const parts = convId.split('_');
    if (!parts.includes(me)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const result = await messageRepo.getMessages(convId, { limit, cursor });

    // Mark messages sent TO this user as delivered
    await messageRepo.markDelivered(convId, me);

    res.json({ success: true, messages: result.messages, nextCursor: result.nextCursor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /messages
 * Send a message. Idempotent via clientId.
 */
export async function sendMessage(req, res) {
  try {
    const me = String(req.user._id || req.user.id);
    const { receiverId, message, type = 'text', clientId } = req.body;

    if (!receiverId) return res.status(400).json({ success: false, message: 'receiverId required' });
    if (type === 'text' && !message?.trim()) {
      return res.status(400).json({ success: false, message: 'message required for text type' });
    }

    const convId = messageRepo.constructor.conversationId(me, receiverId);

    // Idempotency check
    if (clientId) {
      const existing = await messageRepo.findByClientId(clientId);
      if (existing) return res.json({ success: true, message: existing, duplicate: true });
    }

    const msg = await messageRepo.send({
      conversationId: convId,
      senderId:       me,
      receiverId,
      message:        message?.trim() || '',
      type,
      clientId:       clientId || undefined,
    });

    // Notify receiver via Socket.io
    try {
      getIO()?.to(`user:${receiverId}`).emit('message:receive', {
        conversationId: convId,
        senderId:       me,
        receiverId,
        message:        msg.message,
        type:           msg.type,
        clientId:       msg.clientId,
        _id:            String(msg.id),
        createdAt:      msg.createdAt,
      });
    } catch (_) {}

    res.status(201).json({ success: true, message: msg });
  } catch (err) {
    if (err?.code === '23505') {
      // Unique constraint violation — duplicate clientId
      const dup = await messageRepo.findByClientId(req.body.clientId).catch(() => null);
      if (dup) return res.json({ success: true, message: dup, duplicate: true });
    }
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * PATCH /messages/:conversationId/read
 */
export async function markRead(req, res) {
  try {
    const me     = String(req.user._id || req.user.id);
    const convId = req.params.conversationId;

    await messageRepo.markRead(convId, me);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /messages/start
 * Start or get a conversation with another user.
 */
export async function startConversation(req, res) {
  try {
    const me = String(req.user._id || req.user.id);
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ success: false, message: 'targetUserId required' });

    const convId = messageRepo.constructor.conversationId(me, targetUserId);

    const other = await userRepo.findById(targetUserId);
    if (!other) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      conversationId: convId,
      participant: {
        id:     String(other.id),
        name:   other.name    || 'Itilizatè',
        role:   other.profession || other.role || '',
        city:   other.location?.city || '',
        avatar: other.profilePhoto
          || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(other.name || 'u')}`,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}