import { PresenceRepository } from '../repositories/PresenceRepository.js';
import { RoomRepository }     from '../repositories/RoomRepository.js';
import { AppError }           from '../../../core/errors/AppError.js';
import { CallStatus }         from '../types/chat.types.js';
import type { ChatCall, CallType } from '../types/chat.types.js';

export const CallService = {
  async initiate(roomId: string, callerId: string, type: CallType): Promise<ChatCall> {
    const member = await RoomRepository.getMember(roomId, callerId);
    if (!member) throw new AppError('Not a member of this room', 403, 'FORBIDDEN');

    const call = await PresenceRepository.createCall({ roomId, callerId, type });
    await PresenceRepository.addCallParticipant(call.id, callerId);
    return call;
  },

  async answer(callId: string, userId: string): Promise<ChatCall> {
    const call = await PresenceRepository.getCall(callId);
    if (!call) throw new AppError('Call not found', 404, 'NOT_FOUND');
    if (call.status !== CallStatus.Ringing) throw new AppError('Call is not ringing', 400, 'INVALID_STATE');

    await PresenceRepository.updateCall(callId, {
      status: CallStatus.Active, startedAt: new Date().toISOString(),
    });
    await PresenceRepository.addCallParticipant(callId, userId);
    return PresenceRepository.getCall(callId) as Promise<ChatCall>;
  },

  async end(callId: string, userId: string): Promise<void> {
    const call = await PresenceRepository.getCall(callId);
    if (!call) throw new AppError('Call not found', 404, 'NOT_FOUND');

    const now     = new Date().toISOString();
    const started = call.startedAt ? new Date(call.startedAt).getTime() : null;
    const duration = started ? Math.floor((Date.now() - started) / 1000) : undefined;

    const update: Parameters<typeof PresenceRepository.updateCall>[1] = {
      status: CallStatus.Ended, endedAt: now,
    };
    if (duration !== undefined) (update as unknown as Record<string, unknown>)['duration'] = duration;
    await PresenceRepository.updateCall(callId, update);
  },

  async decline(callId: string, userId: string): Promise<void> {
    await PresenceRepository.updateCall(callId, { status: CallStatus.Declined });
  },

  async get(callId: string): Promise<ChatCall | null> {
    return PresenceRepository.getCall(callId);
  },
};
