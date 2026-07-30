import { db }        from '../../../core/database/SupabaseClient.js';
import { AppError }  from '../../../core/errors/AppError.js';
import { RoomType }  from '../types/chat.types.js';
import type { ChatRoom, ChatMember, RoomRole } from '../types/chat.types.js';

function toRoom(r: Record<string, unknown>): ChatRoom {
  const base: ChatRoom = {
    id: r['id'] as string, type: r['type'] as RoomType,
    createdBy: r['created_by'] as string,
    isArchived: (r['is_archived'] as boolean) ?? false,
    isEncrypted: (r['is_encrypted'] as boolean) ?? false,
    memberCount: (r['member_count'] as number) ?? 0,
    createdAt: r['created_at'] as string, updatedAt: r['updated_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['name'])            b['name']           = r['name'];
  if (r['avatar_url'])      b['avatarUrl']       = r['avatar_url'];
  if (r['description'])     b['description']     = r['description'];
  if (r['job_id'])          b['jobId']           = r['job_id'];
  if (r['order_id'])        b['orderId']         = r['order_id'];
  if (r['last_message_at']) b['lastMessageAt']   = r['last_message_at'];
  if (r['metadata'])        b['metadata']        = r['metadata'];
  return base;
}

function toMember(r: Record<string, unknown>): ChatMember {
  const base: ChatMember = {
    roomId: r['room_id'] as string, userId: r['user_id'] as string,
    role: r['role'] as RoomRole, joinedAt: r['joined_at'] as string,
    isMuted: (r['is_muted'] as boolean) ?? false,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['left_at'])  b['leftAt']  = r['left_at'];
  if (r['nickname']) b['nickname'] = r['nickname'];
  return base;
}

export const RoomRepository = {
  async create(data: {
    type: RoomType; createdBy: string; name?: string | undefined;
    description?: string | undefined; isEncrypted?: boolean;
    jobId?: string | undefined; orderId?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
  }): Promise<ChatRoom> {
    const row: Record<string, unknown> = {
      type: data.type, created_by: data.createdBy,
      is_archived: false, is_encrypted: data.isEncrypted ?? false, member_count: 0,
    };
    if (data.name)        row['name']        = data.name;
    if (data.description) row['description'] = data.description;
    if (data.jobId)       row['job_id']      = data.jobId;
    if (data.orderId)     row['order_id']    = data.orderId;
    if (data.metadata)    row['metadata']    = data.metadata;

    const { data: saved, error } = await db.client()
      .from('chat_rooms').insert(row).select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new AppError('Failed to create room', 500, 'DB_ERROR');
    return toRoom(saved);
  },

  async findById(id: string): Promise<ChatRoom | null> {
    const { data } = await db.client().from('chat_rooms').select('*')
      .eq('id', id).single<Record<string, unknown>>();
    return data ? toRoom(data) : null;
  },

  async findDirectRoom(userA: string, userB: string): Promise<ChatRoom | null> {
    // Find direct rooms where both users are members
    const { data } = await db.client().from('chat_rooms').select(`
      *, chat_members!inner(user_id)
    `).eq('type', RoomType.Direct)
      .eq('chat_members.user_id', userA)
      .single<Record<string, unknown>>();

    if (!data) return null;
    // Verify both members are in the room
    const room = toRoom(data);
    const memberB = await RoomRepository.getMember(room.id, userB);
    return memberB ? room : null;
  },

  async listForUser(userId: string, limit = 50): Promise<ChatRoom[]> {
    // Get room IDs the user is a member of
    const { data: memberRows } = await db.client().from('chat_members').select('room_id')
      .eq('user_id', userId).is('left_at', null)
      .returns<Array<{ room_id: string }>>();
    if (!memberRows || memberRows.length === 0) return [];

    const roomIds = memberRows.map(r => r.room_id);
    const { data } = await db.client().from('chat_rooms').select('*')
      .in('id', roomIds).order('last_message_at', { ascending: false }).limit(limit)
      .returns<Record<string, unknown>[]>();
    return (data ?? []).map(toRoom);
  },

  async update(id: string, patch: { name?: string; description?: string; avatarUrl?: string; isArchived?: boolean }): Promise<ChatRoom> {
    const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.name        !== undefined) row['name']        = patch.name;
    if (patch.description !== undefined) row['description'] = patch.description;
    if (patch.avatarUrl   !== undefined) row['avatar_url']  = patch.avatarUrl;
    if (patch.isArchived  !== undefined) row['is_archived'] = patch.isArchived;
    const { data, error } = await db.client().from('chat_rooms')
      .update(row).eq('id', id).select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to update room', 500, 'DB_ERROR');
    return toRoom(data);
  },

  // Members
  async addMember(roomId: string, userId: string, role: RoomRole = 'member'): Promise<ChatMember> {
    const { data, error } = await db.client().from('chat_members')
      .upsert({ room_id: roomId, user_id: userId, role, joined_at: new Date().toISOString(), is_muted: false }, { onConflict: 'room_id,user_id' })
      .select('*').single<Record<string, unknown>>();
    if (error ?? !data) throw new AppError('Failed to add member', 500, 'DB_ERROR');
    return toMember(data);
  },

  async removeMember(roomId: string, userId: string): Promise<void> {
    await db.client().from('chat_members')
      .update({ left_at: new Date().toISOString() })
      .eq('room_id', roomId).eq('user_id', userId);
  },

  async getMember(roomId: string, userId: string): Promise<ChatMember | null> {
    const { data } = await db.client().from('chat_members').select('*')
      .eq('room_id', roomId).eq('user_id', userId).is('left_at', null)
      .single<Record<string, unknown>>();
    return data ? toMember(data) : null;
  },

  async listMembers(roomId: string): Promise<ChatMember[]> {
    const { data } = await db.client().from('chat_members').select('*')
      .eq('room_id', roomId).is('left_at', null)
      .returns<Record<string, unknown>[]>();
    return (data ?? []).map(toMember);
  },
};
