import { PresenceRepository } from '../repositories/PresenceRepository.js';
import { PresenceStatus }      from '../types/chat.types.js';
import type { ChatPresence }   from '../types/chat.types.js';

// In-memory typing state (Redis in production)
const typingState = new Map<string, Map<string, NodeJS.Timeout>>();

export const PresenceService = {
  async setOnline(userId: string, deviceId?: string | undefined, activeRoom?: string | undefined): Promise<void> {
    await PresenceRepository.upsert(userId, PresenceStatus.Online, activeRoom, deviceId);
  },

  async setOffline(userId: string): Promise<void> {
    // Clear any typing state
    typingState.delete(userId);
    await PresenceRepository.setOffline(userId);
  },

  async setStatus(userId: string, status: PresenceStatus): Promise<void> {
    await PresenceRepository.upsert(userId, status);
  },

  async setActiveRoom(userId: string, roomId: string | undefined): Promise<void> {
    const current = await PresenceRepository.get(userId);
    await PresenceRepository.upsert(userId, current?.status ?? PresenceStatus.Online, roomId);
  },

  async get(userId: string): Promise<ChatPresence | null> {
    return PresenceRepository.get(userId);
  },

  async getMany(userIds: string[]): Promise<ChatPresence[]> {
    return PresenceRepository.getMany(userIds);
  },

  // Typing indicators (volatile — in-memory with TTL)
  startTyping(roomId: string, userId: string): void {
    let roomMap = typingState.get(roomId);
    if (!roomMap) { roomMap = new Map(); typingState.set(roomId, roomMap); }

    // Clear existing timer for this user
    const existing = roomMap.get(userId);
    if (existing) clearTimeout(existing);

    // Auto-clear after 5s of inactivity
    const timer = setTimeout(() => {
      const rm = typingState.get(roomId);
      if (rm) { rm.delete(userId); if (rm.size === 0) typingState.delete(roomId); }
    }, 5000);
    roomMap.set(userId, timer);
  },

  stopTyping(roomId: string, userId: string): void {
    const roomMap = typingState.get(roomId);
    if (!roomMap) return;
    const timer = roomMap.get(userId);
    if (timer) clearTimeout(timer);
    roomMap.delete(userId);
    if (roomMap.size === 0) typingState.delete(roomId);
  },

  getTypingUsers(roomId: string): string[] {
    const roomMap = typingState.get(roomId);
    if (!roomMap) return [];
    return Array.from(roomMap.keys());
  },
};
