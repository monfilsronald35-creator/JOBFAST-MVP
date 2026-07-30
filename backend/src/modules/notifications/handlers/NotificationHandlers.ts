/**
 * Event handlers that translate domain events into notifications.
 * This module is a pure event consumer — no direct dependency on jobs/users modules.
 * It only receives typed events through the event bus.
 */

import { TypedEventBus } from '../../../core/events/TypedEventBus.js';
import { NotificationService } from '../services/NotificationService.js';
import { EVENT_NAMES } from '@shared-events';
import type { JobAssignedPayload, JobCompletedPayload, NotifyUserPayload } from '@shared-events';
import type { EventEnvelope } from '../../../core/events/DomainEvent.js';

const service = new NotificationService();

export function registerNotificationHandlers(): void {
  // Job assigned → notify the worker
  TypedEventBus.subscribe<{ payload: { jobId: string; clientId: string; workerId: string } }>(
    EVENT_NAMES.JOB_ASSIGNED,
    async (envelope: EventEnvelope) => {
      const { workerId, jobId } = envelope.payload as JobAssignedPayload;
      await service.send({
        userId:    workerId,
        type:      'job_update',
        title:     'Nouvo travay asiye pou ou!',
        body:      `Yon travay (${jobId}) asiye ba ou. Klike pou wè detay yo.`,
        channels:  ['in_app', 'push'],
        actionUrl: `/jobs/${jobId}`,
        data:      { jobId },
      });
    },
  );

  // Job completed → notify the client + worker (payment release)
  TypedEventBus.subscribe(
    EVENT_NAMES.JOB_COMPLETED,
    async (envelope: EventEnvelope) => {
      const { clientId, workerId, jobId } = envelope.payload as JobCompletedPayload;
      await Promise.all([
        service.send({
          userId:   clientId,
          type:     'job_update',
          title:    'Travay la fini!',
          body:     'Kliyan an konfime travay la fini. Peman an ap trete.',
          channels: ['in_app', 'push'],
          actionUrl: `/jobs/${jobId}`,
          data:     { jobId },
        }),
        service.send({
          userId:   workerId,
          type:     'payment',
          title:    'Peman an nan wout!',
          body:     'Bon travay! Peman ou an ap trete.',
          channels: ['in_app', 'push'],
          actionUrl: `/wallet`,
          data:     { jobId },
        }),
      ]);
    },
  );

  // User registered → welcome notification
  TypedEventBus.subscribe(
    EVENT_NAMES.USER_REGISTERED,
    async (envelope: EventEnvelope) => {
      const { userId, fullName } = envelope.payload as { userId: string; fullName: string };
      await service.send({
        userId,
        type:     'system',
        title:    `Byenvini, ${fullName}!`,
        body:     'Kont ou kreye avèk siksè. Kòmanse eksplore JOBFAST kounye a.',
        channels: ['in_app'],
        actionUrl: '/',
      });
    },
  );

  // Direct notify — any module can dispatch this to send an ad-hoc notification
  TypedEventBus.subscribe(
    EVENT_NAMES.NOTIFY_USER,
    async (envelope: EventEnvelope) => {
      const p = envelope.payload as NotifyUserPayload;
      await service.send({
        userId:   p.userId,
        type:     p.type as 'system',
        title:    p.title,
        body:     p.body,
        channels: (p.channels ?? ['in_app']) as ('in_app' | 'push' | 'email' | 'sms')[],
        data:     p.data,
      });
    },
  );
}
