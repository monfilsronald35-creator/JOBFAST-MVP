import { RoomRepository }   from '../repositories/RoomRepository.js';
import { MessageRepository } from '../repositories/MessageRepository.js';
import { ModerationService } from './ModerationService.js';
import { AppError }          from '../../../core/errors/AppError.js';
import { MessageType, ModerationAction } from '../types/chat.types.js';
import type { ChatMessage, CreateMessageInput } from '../types/chat.types.js';

export const MessageService = {
  async send(input: CreateMessageInput): Promise<ChatMessage> {
    // Verify sender is a room member
    const member = await RoomRepository.getMember(input.roomId, input.senderId);
    if (!member) throw new AppError('Not a member of this room', 403, 'FORBIDDEN');

    const message = await MessageRepository.create({
      roomId: input.roomId, senderId: input.senderId,
      type: input.type, content: input.content,
      replyToId: input.replyToId, metadata: input.metadata,
    });

    // Save attachments if any
    if (input.attachments && input.attachments.length > 0) {
      const attachments = await MessageRepository.createAttachments(message.id, input.attachments);
      const m = message as unknown as Record<string, unknown>;
      m['attachments'] = attachments;
    }

    // Async moderation (non-blocking)
    if (input.type === MessageType.Text && input.content) {
      ModerationService.analyze(message.id, input.senderId, input.content)
        .then(async result => {
          if (result.action !== ModerationAction.None) {
            await MessageRepository.update(message.id, { moderationAction: result.action });
          }
        })
        .catch(() => undefined);
    }

    return message;
  },

  async edit(messageId: string, userId: string, newContent: string): Promise<ChatMessage> {
    const message = await MessageRepository.findById(messageId);
    if (!message) throw new AppError('Message not found', 404, 'NOT_FOUND');
    if (message.senderId !== userId) throw new AppError('Cannot edit another user\'s message', 403, 'FORBIDDEN');
    if (message.isDeleted) throw new AppError('Cannot edit deleted message', 400, 'INVALID_STATE');
    return MessageRepository.update(messageId, { content: newContent, isEdited: true });
  },

  async delete(messageId: string, userId: string, roomId: string): Promise<void> {
    const message = await MessageRepository.findById(messageId);
    if (!message) throw new AppError('Message not found', 404, 'NOT_FOUND');

    // Allow sender or room admin/owner to delete
    if (message.senderId !== userId) {
      const member = await RoomRepository.getMember(roomId, userId);
      if (!member || member.role === 'member') throw new AppError('Cannot delete this message', 403, 'FORBIDDEN');
    }
    await MessageRepository.softDelete(messageId);
  },

  async list(roomId: string, userId: string, opts: { cursor?: string; limit?: number } = {}): Promise<ChatMessage[]> {
    const member = await RoomRepository.getMember(roomId, userId);
    if (!member) throw new AppError('Not a member', 403, 'FORBIDDEN');
    return MessageRepository.listByRoom(roomId, opts);
  },

  async react(messageId: string, userId: string, emoji: string): Promise<void> {
    await MessageRepository.addReaction(messageId, userId, emoji);
  },

  async unreact(messageId: string, userId: string, emoji: string): Promise<void> {
    await MessageRepository.removeReaction(messageId, userId, emoji);
  },

  async pin(roomId: string, messageId: string, userId: string): Promise<void> {
    const member = await RoomRepository.getMember(roomId, userId);
    if (!member || member.role === 'member') throw new AppError('Only admins can pin messages', 403, 'FORBIDDEN');
    await MessageRepository.pinMessage(roomId, messageId, userId);
  },

  async unpin(roomId: string, messageId: string, userId: string): Promise<void> {
    const member = await RoomRepository.getMember(roomId, userId);
    if (!member || member.role === 'member') throw new AppError('Only admins can unpin messages', 403, 'FORBIDDEN');
    await MessageRepository.unpinMessage(roomId, messageId);
  },

  async getPinned(roomId: string, userId: string): Promise<ChatMessage[]> {
    const member = await RoomRepository.getMember(roomId, userId);
    if (!member) throw new AppError('Not a member', 403, 'FORBIDDEN');
    return MessageRepository.listPinned(roomId);
  },
};
