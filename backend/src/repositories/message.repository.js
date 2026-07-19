/**
 * MessageRepository — maps the `messages` Supabase table.
 *
 * Replaces:
 *   Message.aggregate(...)   → getConversations()
 *   Message.find(...)        → getMessages()
 *   Message.create(...)      → send()
 *   Message.findOne(...)     → findByClientId()
 *   Message.updateMany(...)  → markDelivered() / markRead()
 *   Message.countDocuments() → countUnread()
 *
 * Mongoose field → Supabase column:
 *   conversationId → conversation_id
 *   senderId       → sender_id
 *   receiverId     → receiver_id
 *   message        → message
 *   type           → type
 *   clientId       → client_id
 *   status         → status
 *   readAt         → read_at
 */

import { BaseRepository } from './base.repository.js';
import supabase from '../config/supabaseClient.js';

class MessageRepository extends BaseRepository {
  constructor() {
    super('messages');
  }

  // ── Mapping ───────────────────────────────────────────────────────────────

  _toRow(obj) {
    const row = {};
    if (obj.conversationId !== undefined) row.conversation_id = obj.conversationId;
    if (obj.senderId       !== undefined) row.sender_id       = obj.senderId;
    if (obj.receiverId     !== undefined) row.receiver_id     = obj.receiverId;
    if (obj.message        !== undefined) row.message         = obj.message;
    if (obj.type           !== undefined) row.type            = obj.type;
    if (obj.clientId       !== undefined) row.client_id       = obj.clientId;
    if (obj.status         !== undefined) row.status          = obj.status;
    if (obj.readAt         !== undefined) row.read_at         = obj.readAt;
    return row;
  }

  _toModel(row) {
    if (!row) return null;
    return {
      _id:            row.id,
      id:             row.id,
      conversationId: row.conversation_id,
      senderId:       row.sender_id,
      receiverId:     row.receiver_id,
      message:        row.message         ?? '',
      type:           row.type            ?? 'text',
      clientId:       row.client_id,
      status:         row.status          ?? 'sent',
      readAt:         row.read_at,
      createdAt:      row.created_at,
      updatedAt:      row.updated_at,
    };
  }

  // ── Domain methods ────────────────────────────────────────────────────────

  /**
   * Deterministic conversation ID: sorted pair of user IDs.
   * Matches the Mongoose controller convention exactly.
   */
  static conversationId(userA, userB) {
    return [String(userA), String(userB)].sort().join('_');
  }

  /**
   * Latest message per conversation for a user, enriched with the other
   * participant's profile. Replaces the MongoDB aggregate pipeline.
   */
  async getConversations(userId) {
    // Fetch all messages where user is sender or receiver, ordered newest first
    const { data, error } = await supabase
      .from('messages')
      .select('conversation_id, message, type, created_at, sender_id, receiver_id, status')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(500); // wide window to deduplicate per conversation

    if (error) this._unwrap({ data, error });

    // Deduplicate: keep only the latest message per conversation_id
    const seen = new Map();
    for (const row of (data || [])) {
      if (!seen.has(row.conversation_id)) seen.set(row.conversation_id, row);
    }

    const latest = [...seen.values()].slice(0, 50);

    // Enrich with the other participant's profile (batch N+1 avoided via Promise.all)
    const conversations = await Promise.all(
      latest.map(async (conv) => {
        const otherId = conv.sender_id === userId ? conv.receiver_id : conv.sender_id;

        const { data: profile } = await supabase
          .from('profiles')
          .select('name, profession, role, location_city, profile_photo')
          .eq('id', otherId)
          .maybeSingle();

        const unread = await this.countUnread(conv.conversation_id, userId);

        return {
          id:          conv.conversation_id,
          name:        profile?.name        || 'Itilizatè',
          role:        profile?.profession  || profile?.role || '',
          city:        profile?.location_city || '',
          avatar:      profile?.profile_photo
            || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profile?.name || 'u')}`,
          lastMessage: conv.type === 'text' ? conv.message : '🎤 Voice message',
          time:        conv.created_at,
          unread,
          online:      false,
          otherId:     String(otherId),
        };
      })
    );

    return conversations.sort((a, b) => new Date(b.time) - new Date(a.time));
  }

  /**
   * Paginated messages in a conversation (cursor-based, newest first).
   */
  async getMessages(conversationId, { limit = 30, cursor = null } = {}) {
    let q = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit + 1);

    if (cursor) q = q.lt('created_at', cursor);

    const { data, error } = await q;
    this._unwrap({ data, error });

    const hasMore    = (data || []).length > limit;
    const paginated  = hasMore ? data.slice(0, limit) : (data || []);
    const nextCursor = hasMore ? paginated[paginated.length - 1].created_at : null;

    return {
      messages:   paginated.reverse().map(r => this._toModel(r)),
      hasMore,
      nextCursor,
    };
  }

  /** Idempotency check by clientId. */
  async findByClientId(clientId) {
    return this.findOne({ client_id: clientId });
  }

  /** Create and persist a new message. */
  async send({ conversationId, senderId, receiverId, message, type = 'text', clientId }) {
    return this.insert({
      conversationId,
      senderId,
      receiverId,
      message: message?.trim() || '',
      type,
      clientId: clientId || undefined,
      status: 'sent',
    });
  }

  /** Count unread messages sent TO userId in a conversation. */
  async countUnread(conversationId, userId) {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userId)
      .neq('status', 'read');
    if (error) this._unwrap({ data: null, error });
    return count ?? 0;
  }

  /** Mark as delivered for all messages sent TO userId in a conversation. */
  async markDelivered(conversationId, userId) {
    const { error } = await supabase
      .from('messages')
      .update({ status: 'delivered', updated_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userId)
      .eq('status', 'sent');
    if (error) this._unwrap({ data: null, error });
  }

  /** Mark all messages in a conversation as read for the given user. */
  async markRead(conversationId, userId) {
    const { error } = await supabase
      .from('messages')
      .update({ status: 'read', read_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userId)
      .neq('status', 'read');
    if (error) this._unwrap({ data: null, error });
  }
}

export default new MessageRepository();