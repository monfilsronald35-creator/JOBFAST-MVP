import Message from '../models/message.model.js';
import User    from '../models/user.model.js';
import mongoose from 'mongoose';
import { getIO } from '../utils/io.js';

/** Deterministic conversation ID: sorted pair of user IDs */
function conversationId(a, b) {
  return [String(a), String(b)].sort().join('_');
}

/**
 * GET /messages/conversations
 * Returns the latest message from each conversation this user is part of,
 * enriched with the other participant's profile.
 */
export async function getConversations(req, res) {
  try {
    const uid = req.user._id || req.user.id;

    // Latest message per conversation where this user is sender or receiver
    const latest = await Message.aggregate([
      { $match: {
          $or: [
            { senderId:   new mongoose.Types.ObjectId(uid) },
            { receiverId: new mongoose.Types.ObjectId(uid) },
          ],
        },
      },
      { $sort: { createdAt: -1 } },
      { $group: {
          _id:         '$conversationId',
          lastMessage: { $first: '$message' },
          lastType:    { $first: '$type' },
          lastTime:    { $first: '$createdAt' },
          senderId:    { $first: '$senderId' },
          receiverId:  { $first: '$receiverId' },
          status:      { $first: '$status' },
        },
      },
      { $sort: { lastTime: -1 } },
      { $limit: 50 },
    ]);

    // Enrich with other participant's info
    const conversations = await Promise.all(
      latest.map(async (conv) => {
        const otherId = String(conv.senderId) === String(uid)
          ? conv.receiverId
          : conv.senderId;

        const other = await User.findById(otherId)
          .select('name profession role location.city profileMetadata.profilePhoto')
          .lean();

        // Count unread messages sent TO this user in this conversation
        const unread = await Message.countDocuments({
          conversationId: conv._id,
          receiverId: uid,
          status: { $ne: 'read' },
        });

        return {
          id:          conv._id,
          name:        other?.name        || 'Itilizatè',
          role:        other?.profession  || other?.role || '',
          city:        other?.location?.city || '',
          avatar:      other?.profileMetadata?.profilePhoto
            || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(other?.name || 'u')}`,
          lastMessage: conv.lastType === 'text' ? conv.lastMessage : '🎤 Voice message',
          time:        conv.lastTime,
          unread,
          online:      false,
          otherId:     String(otherId),
        };
      })
    );

    res.json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * GET /messages/:conversationId
 * Returns messages in a conversation (cursor-based pagination).
 */
export async function getMessages(req, res) {
  try {
    const { conversationId: convId } = req.params;
    const uid    = req.user._id || req.user.id;
    const limit  = Math.min(Number(req.query.limit) || 30, 100);
    const cursor = req.query.cursor ? new Date(req.query.cursor) : null;

    // Verify the requesting user is part of this conversation
    const parts = convId.split('_');
    if (!parts.includes(String(uid))) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const query = { conversationId: convId };
    if (cursor) query.createdAt = { $lt: cursor };

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore     = messages.length > limit;
    const paginated   = hasMore ? messages.slice(0, limit) : messages;
    const nextCursor  = hasMore ? paginated[paginated.length - 1].createdAt : null;

    // Mark delivered for messages received by this user
    await Message.updateMany(
      { conversationId: convId, receiverId: uid, status: 'sent' },
      { $set: { status: 'delivered' } }
    );

    res.json({ success: true, messages: paginated.reverse(), nextCursor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /messages
 * Send (persist) a message. Idempotent via clientId.
 */
export async function sendMessage(req, res) {
  try {
    const uid = String(req.user._id || req.user.id);
    const { receiverId, message, type = 'text', clientId } = req.body;

    if (!receiverId) return res.status(400).json({ success: false, message: 'receiverId required' });
    if (type === 'text' && !message?.trim()) {
      return res.status(400).json({ success: false, message: 'message required for text type' });
    }

    const convId = conversationId(uid, receiverId);

    // Idempotency: return existing if same clientId
    if (clientId) {
      const existing = await Message.findOne({ clientId }).lean();
      if (existing) return res.json({ success: true, message: existing, duplicate: true });
    }

    const msg = await Message.create({
      conversationId: convId,
      senderId:       uid,
      receiverId,
      message:        message?.trim() || '',
      type,
      clientId:       clientId || undefined,
      status:         'sent',
    });

    // Notify receiver in real-time via their personal socket room
    try {
      getIO()?.to(`user:${receiverId}`).emit('message:receive', {
        conversationId: convId,
        senderId:       uid,
        receiverId,
        message:        msg.message,
        type:           msg.type,
        clientId:       msg.clientId,
        _id:            String(msg._id),
        createdAt:      msg.createdAt,
      });
    } catch (_) {}

    res.status(201).json({ success: true, message: msg });
  } catch (err) {
    if (err.code === 11000) {
      const dup = await Message.findOne({ clientId: req.body.clientId }).lean();
      return res.json({ success: true, message: dup, duplicate: true });
    }
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * PATCH /messages/:conversationId/read
 * Mark all messages in a conversation as read for the current user.
 */
export async function markRead(req, res) {
  try {
    const uid    = req.user._id || req.user.id;
    const convId = req.params.conversationId;

    await Message.updateMany(
      { conversationId: convId, receiverId: uid, status: { $ne: 'read' } },
      { $set: { status: 'read', readAt: new Date() } }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * POST /messages/start
 * Start or get a conversation with another user (returns conversationId).
 * Used when clicking "Message" on a profile page.
 */
export async function startConversation(req, res) {
  try {
    const uid        = String(req.user._id || req.user.id);
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ success: false, message: 'targetUserId required' });

    const convId = conversationId(uid, targetUserId);

    // Get the other user's basic info
    const other = await User.findById(targetUserId)
      .select('name profession role location.city profileMetadata.profilePhoto')
      .lean();

    if (!other) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({
      success: true,
      conversationId: convId,
      participant: {
        id:     String(other._id),
        name:   other.name || 'Itilizatè',
        role:   other.profession || other.role || '',
        city:   other.location?.city || '',
        avatar: other.profileMetadata?.profilePhoto
          || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(other.name || 'u')}`,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
}
