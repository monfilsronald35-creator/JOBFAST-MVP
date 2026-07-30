import { MessageRepository } from '../repositories/MessageRepository.js';
import { ReadStatus }         from '../types/chat.types.js';
import type { ChatReadReceipt } from '../types/chat.types.js';

export const ReadReceiptService = {
  async markDelivered(messageId: string, roomId: string, userId: string): Promise<void> {
    const existing = await MessageRepository.listReceipts(messageId);
    const userReceipt = existing.find(r => r.userId === userId);
    // Only upgrade status, never downgrade
    if (!userReceipt || userReceipt.status === ReadStatus.Sent) {
      await MessageRepository.upsertReceipt({ messageId, roomId, userId, status: ReadStatus.Delivered });
    }
  },

  async markRead(messageId: string, roomId: string, userId: string): Promise<void> {
    await MessageRepository.upsertReceipt({
      messageId, roomId, userId, status: ReadStatus.Read, readAt: new Date().toISOString(),
    });
  },

  async markRoomRead(roomId: string, userId: string, messageIds: string[]): Promise<void> {
    const now = new Date().toISOString();
    await Promise.all(messageIds.map(mid =>
      MessageRepository.upsertReceipt({ messageId: mid, roomId, userId, status: ReadStatus.Read, readAt: now })
    ));
  },

  async getReceipts(messageId: string): Promise<ChatReadReceipt[]> {
    return MessageRepository.listReceipts(messageId);
  },

  async getReadByAll(messageId: string, memberCount: number): Promise<boolean> {
    const receipts = await MessageRepository.listReceipts(messageId);
    const readCount = receipts.filter(r => r.status === ReadStatus.Read).length;
    return readCount >= memberCount;
  },
};
