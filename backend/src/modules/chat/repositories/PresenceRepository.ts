import { db }        from '../../../core/database/SupabaseClient.js';
import { PresenceStatus } from '../types/chat.types.js';
import type { ChatPresence, ChatCall, CallType, CallStatus } from '../types/chat.types.js';

function toPresence(r: Record<string, unknown>): ChatPresence {
  const base: ChatPresence = {
    userId: r['user_id'] as string, status: r['status'] as PresenceStatus,
    lastSeen: r['last_seen'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['active_room']) b['activeRoom'] = r['active_room'];
  if (r['device_id'])   b['deviceId']   = r['device_id'];
  return base;
}

function toCall(r: Record<string, unknown>): ChatCall {
  const base: ChatCall = {
    id: r['id'] as string, roomId: r['room_id'] as string,
    callerId: r['caller_id'] as string, type: r['type'] as CallType,
    status: r['status'] as CallStatus, participants: [],
    createdAt: r['created_at'] as string,
  };
  const b = base as unknown as Record<string, unknown>;
  if (r['started_at']) b['startedAt'] = r['started_at'];
  if (r['ended_at'])   b['endedAt']   = r['ended_at'];
  if (r['duration'])   b['duration']  = r['duration'];
  if (r['metadata'])   b['metadata']  = r['metadata'];
  return base;
}

export const PresenceRepository = {
  async upsert(userId: string, status: PresenceStatus, activeRoom?: string | undefined, deviceId?: string | undefined): Promise<void> {
    const row: Record<string, unknown> = {
      user_id: userId, status, last_seen: new Date().toISOString(), updated_at: new Date().toISOString(),
    };
    if (activeRoom) row['active_room'] = activeRoom;
    if (deviceId)   row['device_id']   = deviceId;
    await db.client().from('chat_presence').upsert(row, { onConflict: 'user_id' });
  },

  async get(userId: string): Promise<ChatPresence | null> {
    const { data } = await db.client().from('chat_presence').select('*')
      .eq('user_id', userId).single<Record<string, unknown>>();
    return data ? toPresence(data) : null;
  },

  async getMany(userIds: string[]): Promise<ChatPresence[]> {
    if (userIds.length === 0) return [];
    const { data } = await db.client().from('chat_presence').select('*')
      .in('user_id', userIds).returns<Record<string, unknown>[]>();
    return (data ?? []).map(toPresence);
  },

  async setOffline(userId: string): Promise<void> {
    await db.client().from('chat_presence').upsert({
      user_id: userId, status: PresenceStatus.Offline,
      last_seen: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  },

  // Calls
  async createCall(data: { roomId: string; callerId: string; type: CallType }): Promise<ChatCall> {
    const { data: saved, error } = await db.client().from('chat_calls')
      .insert({ room_id: data.roomId, caller_id: data.callerId, type: data.type, status: 'ringing' })
      .select('*').single<Record<string, unknown>>();
    if (error ?? !saved) throw new Error('Failed to create call');
    return toCall(saved);
  },

  async updateCall(callId: string, patch: { status: CallStatus; startedAt?: string; endedAt?: string; duration?: number }): Promise<void> {
    const row: Record<string, unknown> = { status: patch.status };
    if (patch.startedAt) row['started_at'] = patch.startedAt;
    if (patch.endedAt)   row['ended_at']   = patch.endedAt;
    if (patch.duration)  row['duration']   = patch.duration;
    await db.client().from('chat_calls').update(row).eq('id', callId);
  },

  async addCallParticipant(callId: string, userId: string): Promise<void> {
    await db.client().from('chat_call_participants')
      .upsert({ call_id: callId, user_id: userId, joined_at: new Date().toISOString() },
        { onConflict: 'call_id,user_id' });
  },

  async getCall(callId: string): Promise<ChatCall | null> {
    const { data } = await db.client().from('chat_calls').select('*, chat_call_participants(user_id)')
      .eq('id', callId).single<Record<string, unknown>>();
    if (!data) return null;
    const call = toCall(data);
    const parts = data['chat_call_participants'];
    if (Array.isArray(parts)) {
      call.participants = parts.map((p: Record<string, unknown>) => p['user_id'] as string);
    }
    return call;
  },
};
