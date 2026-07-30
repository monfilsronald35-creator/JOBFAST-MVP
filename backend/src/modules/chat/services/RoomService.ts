import { RoomRepository }            from '../repositories/RoomRepository.js';
import { AppError }                  from '../../../core/errors/AppError.js';
import { RoomType }                  from '../types/chat.types.js';
import type { ChatRoom, ChatMember } from '../types/chat.types.js';

export const RoomService = {
  async createDirect(userA: string, userB: string): Promise<ChatRoom> {
    // Return existing direct room if one exists
    const existing = await RoomRepository.findDirectRoom(userA, userB);
    if (existing) return existing;

    const room = await RoomRepository.create({ type: RoomType.Direct, createdBy: userA });
    await Promise.all([
      RoomRepository.addMember(room.id, userA, 'owner'),
      RoomRepository.addMember(room.id, userB, 'member'),
    ]);
    return room;
  },

  async createGroup(opts: {
    createdBy: string; name: string; memberIds: string[];
    description?: string | undefined; avatarUrl?: string | undefined; isEncrypted?: boolean;
  }): Promise<ChatRoom> {
    const createOpts: Parameters<typeof RoomRepository.create>[0] = {
      type: RoomType.Group, createdBy: opts.createdBy, name: opts.name,
    };
    const co = createOpts as unknown as Record<string, unknown>;
    if (opts.description) co['description'] = opts.description;
    if (opts.isEncrypted) co['isEncrypted'] = opts.isEncrypted;
    const room = await RoomRepository.create(createOpts);
    const memberOps = [RoomRepository.addMember(room.id, opts.createdBy, 'owner')];
    for (const uid of opts.memberIds) {
      if (uid !== opts.createdBy) memberOps.push(RoomRepository.addMember(room.id, uid, 'member'));
    }
    await Promise.all(memberOps);
    return room;
  },

  async createChannel(opts: {
    createdBy: string; name: string; type: RoomType.Channel | RoomType.Community | RoomType.Broadcast | RoomType.Company | RoomType.Support;
    description?: string | undefined; metadata?: Record<string, unknown> | undefined;
  }): Promise<ChatRoom> {
    return RoomRepository.create({
      type: opts.type, createdBy: opts.createdBy,
      name: opts.name, description: opts.description, metadata: opts.metadata,
    });
  },

  async getRoom(roomId: string, userId: string): Promise<ChatRoom> {
    const room   = await RoomRepository.findById(roomId);
    if (!room) throw new AppError('Room not found', 404, 'NOT_FOUND');
    const member = await RoomRepository.getMember(roomId, userId);
    if (!member) throw new AppError('Not a member of this room', 403, 'FORBIDDEN');
    return room;
  },

  async listRooms(userId: string): Promise<ChatRoom[]> {
    return RoomRepository.listForUser(userId);
  },

  async addMember(roomId: string, requesterId: string, targetUserId: string): Promise<ChatMember> {
    const requester = await RoomRepository.getMember(roomId, requesterId);
    if (!requester) throw new AppError('Not a member', 403, 'FORBIDDEN');
    if (requester.role === 'member') throw new AppError('Only admins can add members', 403, 'FORBIDDEN');
    return RoomRepository.addMember(roomId, targetUserId, 'member');
  },

  async removeMember(roomId: string, requesterId: string, targetUserId: string): Promise<void> {
    const requester = await RoomRepository.getMember(roomId, requesterId);
    if (!requester) throw new AppError('Not a member', 403, 'FORBIDDEN');
    if (requester.role === 'member' && requesterId !== targetUserId)
      throw new AppError('Only admins can remove members', 403, 'FORBIDDEN');
    await RoomRepository.removeMember(roomId, targetUserId);
  },

  async updateRoom(roomId: string, requesterId: string, patch: { name?: string; description?: string; avatarUrl?: string }): Promise<ChatRoom> {
    const member = await RoomRepository.getMember(roomId, requesterId);
    if (!member || member.role === 'member') throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
    return RoomRepository.update(roomId, patch);
  },

  async listMembers(roomId: string, userId: string): Promise<ChatMember[]> {
    const member = await RoomRepository.getMember(roomId, userId);
    if (!member) throw new AppError('Not a member', 403, 'FORBIDDEN');
    return RoomRepository.listMembers(roomId);
  },
};
