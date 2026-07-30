import { db }       from '../../../core/database/SupabaseClient.js';
import { AppError } from '../../../core/errors/AppError.js';
import { MessageType, ModerationAction, AttachmentType, ReadStatus } from '../types/chat.types.js';
import type { ChatMessage, ChatAttachment, ChatReaction, ChatReadReceipt, ChatTranslation, ChatModerationLog, ModerationFlag } from '../types/chat.types.js';

function toMessage(r: Record<string, unknown>): ChatMessage {
  const base: ChatMessage = {
    id: r['id'] as string, roomId: r['room_id'] as string,
    senderId: r['sender_id'] as string, type: r['type'] as MessageType,
    isEdited: (r['is_edited'] as boolean) ?? false,
    isDeleted: (r['is_deleted'] as boolean) ?? false,
    isPinned: (r['is_pinned'] as boolean) ?? false,
    moderationAction: (r['moderation_action'] as ModerationAction) ?? ModerationAction.None,
    createdAt: r['created_at'] as string, updatedAt: r['updated_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['content'])     b['content']    = r['content'];
  if (r['metadata'])    b['metadata']   = r['metadata'];
  if (r['reply_to_id']) b['replyToId']  = r['reply_to_id'];
  return base;
}

function toAttachment(r: Record<string, unknown>): ChatAttachment {
  const base: ChatAttachment = {
    id: r['id'] as string, messageId: r['message_id'] as string,
    type: r['type'] as AttachmentType, url: r['url'] as string,
    name: r['name'] as string, size: r['size'] as number, mimeType: r['mime_type'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['thumbnail']) b['thumbnail'] = r['thumbnail'];
  if (r['duration'])  b['duration']  = r['duration'];
  if (r['width'])     b['width']     = r['width'];
  if (r['height'])    b['height']    = r['height'];
  if (r['metadata'])  b['metadata']  = r['metadata'];
  return base;
}

export const MessageRepository = {
  async create(data: {
    roomId: string; senderId: string; type: MessageType;
    content?: string | undefined; replyToId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
  }): Promise<ChatMessage> {
    const row: Record<string, unknown> = {
      room_id: data.roomId, sender_id: data.senderId, type: data.type,
      is_edited: false, is_deleted: false, is_pinned: false, moderation_action: 'none',
    };
    if (data.content)   row['content']     = data.content;
    if (data.replyToId) row['reply_to_id'] = data.replyToId;
    if (data.metadata)  row['metadata']    = data.metadata;
    const { data: saved, error } = await db.client()
      .from('chat_messages').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create message', 500, 'DB_ERROR');
    return toMessage(saved);
  },

  async findById(id: string): Promise<ChatMessage | null> {
    const { data } = await db.client().from('chat_messages').select('*')
      .eq('id', id).single<Record<string, unknown>>();
    return data ? toMessage(data) : null;
  },

  async listByRoom(roomId: string, opts: { limit?: number; cursor?: string; before?: string } = {}): Promise<ChatMessage[]> {
    let q = db.client().from('chat_messages').select('*')
      .eq('room_id', roomId).eq('is_deleted', false)
      .order('created_at', { ascending: false }).limit(opts.limit ?? 50);
    if (opts.cursor) q = q.lt('created_at', opts.cursor);
    if (opts.before) q = q.lt('created_at', opts.before);
    const { data } = await q.returns<Record<string, unknown>[]>();
    return (data ?? []).reverse().map(toMessage);
  },

  async update(id: string, patch: { content?: string; isEdited?: boolean; isPinned?: boolean; moderationAction?: ModerationAction }): Promise<ChatMessage> {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.content          !== undefined) row['content']           = patch.content;
    if (patch.isEdited         !== undefined) row['is_edited']         = patch.isEdited;
    if (patch.isPinned         !== undefined) row['is_pinned']         = patch.isPinned;
    if (patch.moderationAction !== undefined) row['moderation_action'] = patch.moderationAction;
    const { data, error } = await db.client().from('chat_messages')
      .update(row).eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to update message', 500, 'DB_ERROR');
    return toMessage(data);
  },

  async softDelete(id: string): Promise<void> {
    await db.client().from('chat_messages')
      .update({ is_deleted: true, content: null, updated_at: new Date().toISOString() }).eq('id', id);
  },

  // Attachments
  async createAttachments(messageId: string, files: Array<Omit<ChatAttachment, 'id' | 'messageId'>>): Promise<ChatAttachment[]> {
    const rows = files.map(f => {
      const row: Record<string, unknown> = {
        message_id: messageId, type: f.type, url: f.url, name: f.name, size: f.size, mime_type: f.mimeType,
      };
      if (f.thumbnail) row['thumbnail'] = f.thumbnail;
      if (f.duration)  row['duration']  = f.duration;
      if (f.width)     row['width']     = f.width;
      if (f.height)    row['height']    = f.height;
      return row;
    });
    const { data, error } = await db.client().from('chat_attachments')
      .insert(rows).select('*').returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Failed to save attachments', 500, 'DB_ERROR');
    return (data ?? []).map(toAttachment);
  },

  async listAttachments(messageId: string): Promise<ChatAttachment[]> {
    const { data } = await db.client().from('chat_attachments').select('*')
      .eq('message_id', messageId).returns<Record<string, unknown>[]>();
    return (data ?? []).map(toAttachment);
  },

  // Reactions
  async addReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await db.client().from('chat_reactions')
      .upsert({ message_id: messageId, user_id: userId, emoji, created_at: new Date().toISOString() }, { onConflict: 'message_id,user_id,emoji' });
  },

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await db.client().from('chat_reactions')
      .delete().eq('message_id', messageId).eq('user_id', userId).eq('emoji', emoji);
  },

  async listReactions(messageId: string): Promise<ChatReaction[]> {
    const { data } = await db.client().from('chat_reactions').select('*')
      .eq('message_id', messageId).returns<Record<string, unknown>[]>();
    return (data ?? []).map(r => ({
      messageId: r['message_id'] as string, userId: r['user_id'] as string,
      emoji: r['emoji'] as string, createdAt: r['created_at'] as string,
    }));
  },

  // Read receipts
  async upsertReceipt(data: ChatReadReceipt): Promise<void> {
    const row: Record<string, unknown> = {
      message_id: data.messageId, room_id: data.roomId, user_id: data.userId, status: data.status,
    };
    if (data.readAt) row['read_at'] = data.readAt;
    await db.client().from('chat_read_receipts')
      .upsert(row, { onConflict: 'message_id,user_id' });
  },

  async listReceipts(messageId: string): Promise<ChatReadReceipt[]> {
    const { data } = await db.client().from('chat_read_receipts').select('*')
      .eq('message_id', messageId).returns<Record<string, unknown>[]>();
    return (data ?? []).map(r => {
      const base: ChatReadReceipt = {
        messageId: r['message_id'] as string, roomId: r['room_id'] as string,
        userId: r['user_id'] as string, status: r['status'] as ReadStatus,
      };
      const b = base as unknown as Record<string, unknown>;
      if (r['read_at']) b['readAt'] = r['read_at'];
      return base;
    });
  },

  // Translations
  async getTranslation(messageId: string, lang: string): Promise<ChatTranslation | null> {
    const { data } = await db.client().from('chat_translations').select('*')
      .eq('message_id', messageId).eq('target_lang', lang)
      .single<Record<string, unknown>>();
    if (!data) return null;
    return {
      messageId: data['message_id'] as string, targetLang: data['target_lang'] as string,
      translatedText: data['translated_text'] as string, createdAt: data['created_at'] as string,
    };
  },

  async saveTranslation(messageId: string, lang: string, text: string): Promise<void> {
    await db.client().from('chat_translations')
      .upsert({ message_id: messageId, target_lang: lang, translated_text: text, created_at: new Date().toISOString() },
        { onConflict: 'message_id,target_lang' });
  },

  // Moderation
  async saveModerationLog(data: { messageId: string; userId: string; action: string; flags: ModerationFlag[]; score: number }): Promise<void> {
    await db.client().from('chat_moderation_logs').insert({
      message_id: data.messageId, user_id: data.userId, action: data.action,
      flags: data.flags, score: data.score, created_at: new Date().toISOString(),
    });
  },

  // Full-text search
  async search(query: string, opts: { roomId?: string; limit?: number } = {}): Promise<ChatMessage[]> {
    let q = db.client().from('chat_messages').select('*')
      .textSearch('content', query, { type: 'websearch' })
      .eq('is_deleted', false).limit(opts.limit ?? 30);
    if (opts.roomId) q = q.eq('room_id', opts.roomId);
    const { data } = await q.returns<Record<string, unknown>[]>();
    return (data ?? []).map(toMessage);
  },

  // Pins
  async pinMessage(roomId: string, messageId: string, userId: string): Promise<void> {
    await db.client().from('chat_pins')
      .upsert({ room_id: roomId, message_id: messageId, pinned_by: userId, pinned_at: new Date().toISOString() },
        { onConflict: 'room_id,message_id' });
    await db.client().from('chat_messages').update({ is_pinned: true }).eq('id', messageId);
  },

  async unpinMessage(roomId: string, messageId: string): Promise<void> {
    await db.client().from('chat_pins').delete().eq('room_id', roomId).eq('message_id', messageId);
    await db.client().from('chat_messages').update({ is_pinned: false }).eq('id', messageId);
  },

  async listPinned(roomId: string): Promise<ChatMessage[]> {
    const { data } = await db.client().from('chat_messages').select('*')
      .eq('room_id', roomId).eq('is_pinned', true)
      .returns<Record<string, unknown>[]>();
    return (data ?? []).map(toMessage);
  },
};
