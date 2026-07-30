import { TypedEventBus }                    from '../../../core/events/TypedEventBus.js';
import { NotificationOrchestratorService }  from '../services/NotificationOrchestratorService.js';
import { EVENT_NAMES }                      from '@shared-events';
import { NotifEventType, NotifChannel }     from '../types/notification.types.js';
import type { JobAssignedPayload, JobCompletedPayload, NotifyUserPayload } from '@shared-events';
import type { EventEnvelope }              from '../../../core/events/DomainEvent.js';

function pld<T>(ev: EventEnvelope): T { return (ev.payload as unknown) as T; }

export function registerNotificationHandlers(io?: unknown): void {

  // ── Job assigned → notify worker ──────────────────────────────────────────
  TypedEventBus.subscribe(EVENT_NAMES.JOB_ASSIGNED, async (envelope: EventEnvelope) => {
    const { workerId, jobId } = pld<JobAssignedPayload>(envelope);
    void NotificationOrchestratorService.send({
      userId:    workerId,
      eventType: NotifEventType.JobAssigned,
      title:     'Nouvo travay asiye pou ou!',
      body:      `Travay ${jobId} asiye ba ou. Klike pou wè detay yo.`,
      actionUrl: `/jobs/${jobId}`,
      data:      { jobId },
    }, workerId, io);
  });

  // ── Job completed → notify client + worker ────────────────────────────────
  TypedEventBus.subscribe(EVENT_NAMES.JOB_COMPLETED, async (envelope: EventEnvelope) => {
    const { clientId, workerId, jobId } = pld<JobCompletedPayload>(envelope);
    void Promise.all([
      NotificationOrchestratorService.send({
        userId:    clientId,
        eventType: NotifEventType.JobCompleted,
        title:     'Travay la fini!',
        body:      `Travay ${jobId} konfime fini. Peman an ap trete.`,
        actionUrl: `/jobs/${jobId}`,
        data:      { jobId },
      }, clientId, io),
      NotificationOrchestratorService.send({
        userId:    workerId,
        eventType: NotifEventType.PaymentSuccess,
        title:     'Peman an nan wout!',
        body:      'Bon travay! Peman ou an ap trete epi ap voye sou kont ou.',
        actionUrl: '/wallet',
        data:      { jobId },
      }, workerId, io),
    ]);
  });

  // ── User registered → welcome ─────────────────────────────────────────────
  TypedEventBus.subscribe(EVENT_NAMES.USER_REGISTERED, async (envelope: EventEnvelope) => {
    const { userId, fullName, email } = pld<{ userId: string; fullName: string; email: string }>(envelope);
    void NotificationOrchestratorService.send({
      userId,
      eventType: NotifEventType.Welcome,
      title:     `Byenvini, ${fullName}!`,
      body:      'Kont ou kreye avèk siksè. Kòmanse eksplore JOBFAST kounye a.',
      actionUrl: '/',
      data:      { fullName },
    }, email ?? userId, io);
  });

  // ── Payment success ───────────────────────────────────────────────────────
  TypedEventBus.subscribe('payment.completed', async (envelope: EventEnvelope) => {
    const p = pld<{ userId: string; amount: number; currency: string; transactionId: string; email?: string | undefined }>(envelope);
    void NotificationOrchestratorService.send({
      userId:    p.userId,
      eventType: NotifEventType.PaymentSuccess,
      title:     'Peman reyisi!',
      body:      `Ou resevwa ${p.amount} ${p.currency}.`,
      data:      { amount: p.amount, currency: p.currency, transactionId: p.transactionId },
    }, p.email ?? p.userId, io);
  });

  // ── Payment failed ────────────────────────────────────────────────────────
  TypedEventBus.subscribe('payment.failed', async (envelope: EventEnvelope) => {
    const p = pld<{ userId: string; amount: number; currency: string; reason?: string | undefined; email?: string | undefined }>(envelope);
    void NotificationOrchestratorService.send({
      userId:    p.userId,
      eventType: NotifEventType.PaymentFailed,
      title:     'Peman echwe',
      body:      `Peman ${p.amount} ${p.currency} pa reyisi. Rezon: ${p.reason ?? 'unknown'}.`,
      data:      { amount: p.amount, currency: p.currency, reason: p.reason ?? 'unknown' },
    }, p.email ?? p.userId, io);
  });

  // ── Wallet credited ───────────────────────────────────────────────────────
  TypedEventBus.subscribe('wallet.credited', async (envelope: EventEnvelope) => {
    const p = pld<{ userId: string; amount: number; currency: string }>(envelope);
    void NotificationOrchestratorService.send({
      userId:    p.userId,
      eventType: NotifEventType.WalletCredited,
      title:     'Kont ou kreye!',
      body:      `+${p.amount} ${p.currency} ajoute sou kont ou.`,
      data:      { amount: p.amount, currency: p.currency },
    }, p.userId, io);
  });

  // ── Fraud alert ───────────────────────────────────────────────────────────
  TypedEventBus.subscribe('fraud.alert', async (envelope: EventEnvelope) => {
    const p = pld<{ userId: string; email?: string | undefined }>(envelope);
    void NotificationOrchestratorService.send({
      userId:    p.userId,
      eventType: NotifEventType.FraudAlert,
      title:     'Alèt sekirite!',
      body:      'Aktivite sispèk sou kont ou. Konekte pou verifye.',
      data:      { userId: p.userId },
    }, p.email ?? p.userId, io);
  });

  // ── New chat message ──────────────────────────────────────────────────────
  TypedEventBus.subscribe('chat.message.sent', async (envelope: EventEnvelope) => {
    const p = pld<{ recipientId: string; senderName: string; preview: string }>(envelope);
    void NotificationOrchestratorService.send({
      userId:    p.recipientId,
      eventType: NotifEventType.MessageReceived,
      title:     `${p.senderName} voye mesaj`,
      body:      p.preview,
      channels:  [NotifChannel.Push],
      data:      { senderName: p.senderName, preview: p.preview },
    }, p.recipientId, io);
  });

  // ── Incoming video call ───────────────────────────────────────────────────
  TypedEventBus.subscribe('chat.call.incoming', async (envelope: EventEnvelope) => {
    const p = pld<{ calleeId: string; callerName: string }>(envelope);
    void NotificationOrchestratorService.send({
      userId:    p.calleeId,
      eventType: NotifEventType.VideoCallIncoming,
      title:     'Apèl videyo ap vini',
      body:      `${p.callerName} ap rele ou.`,
      channels:  [NotifChannel.Push],
      data:      { callerName: p.callerName },
    }, p.calleeId, io);
  });

  // ── Escrow released ───────────────────────────────────────────────────────
  TypedEventBus.subscribe('escrow.released', async (envelope: EventEnvelope) => {
    const p = pld<{ workerId: string; amount: number; currency: string; jobId: string }>(envelope);
    void NotificationOrchestratorService.send({
      userId:    p.workerId,
      eventType: NotifEventType.WalletCredited,
      title:     'Peman liberé!',
      body:      `${p.amount} ${p.currency} liberé depi escrow pou travay ${p.jobId}.`,
      actionUrl: '/wallet',
      data:      { amount: p.amount, currency: p.currency, jobId: p.jobId },
    }, p.workerId, io);
  });

  // ── Ad-hoc notify ─────────────────────────────────────────────────────────
  TypedEventBus.subscribe(EVENT_NAMES.NOTIFY_USER, async (envelope: EventEnvelope) => {
    const p = pld<NotifyUserPayload>(envelope);
    void NotificationOrchestratorService.send({
      userId:    p.userId,
      eventType: (p.type as NotifEventType) ?? NotifEventType.SystemMaintenance,
      title:     p.title,
      body:      p.body,
      channels:  p.channels as NotifChannel[] | undefined,
      data:      p.data as Record<string, unknown> | undefined,
    }, p.userId, io);
  });
}