/**
 * Chat Module
 * Owns: conversations, messages, read receipts, attachments
 * Real-time delivery: Socket.io rooms (user:{userId})
 * Listens to: job.assigned (open conversation between client and worker)
 * Emits: message.sent, conversation.created
 */
import type { Express } from 'express';
import { Router } from 'express';
import { db } from '../../core/database/SupabaseClient.js';
import { requireAuth } from '../../core/middleware/auth.middleware.js';
import { TypedEventBus } from '../../core/events/TypedEventBus.js';
import { DomainEvent } from '../../core/events/DomainEvent.js';
import { EVENT_NAMES } from '@shared-events';
import { generateId } from '@shared-utils';
import type { UUID } from '@shared-types';

class MessageSentEvent extends DomainEvent {
  constructor(public readonly conversationId: UUID, public readonly senderId: UUID, public readonly messageId: UUID) {
    super(EVENT_NAMES.MESSAGE_SENT);
  }
}

export { MessageSentEvent };

export function registerChatModule(app: Express): void {
  const router = Router();

  router.get('/conversations',       requireAuth, async (req, res, next) => {
    try {
      const { data, error } = await db.client().from('conversations')
        .select('*, messages(id, content, created_at, sender_id)')
        .or(`participant_a.eq.${req.user!.sub},participant_b.eq.${req.user!.sub}`)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  router.get('/conversations/:id/messages', requireAuth, async (req, res, next) => {
    try {
      const cursor = req.query['cursor'] as string | undefined;
      let q = db.client().from('messages').select('*')
        .eq('conversation_id', req.params['id']).order('created_at', { ascending: false }).limit(50);
      if (cursor) q = q.lt('created_at', new Date(Number(cursor)).toISOString());
      const { data, error } = await q;
      if (error) throw error;
      res.json({ success: true, data });
    } catch (err) { next(err); }
  });

  router.post('/conversations/:id/messages', requireAuth, async (req, res, next) => {
    try {
      const msgId = generateId();
      const { data, error } = await db.client().from('messages').insert({
        id:              msgId,
        conversation_id: req.params['id'],
        sender_id:       req.user!.sub,
        content:         req.body.content,
        type:            req.body.type ?? 'text',
        created_at:      new Date().toISOString(),
      }).select().single();
      if (error) throw error;
      TypedEventBus.publish(new MessageSentEvent(req.params['id']!, req.user!.sub, msgId));
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  });

  router.post('/conversations/:id/read', requireAuth, async (req, res, next) => {
    try {
      await db.query(c => c.from('message_reads').upsert({
        conversation_id: req.params['id'], user_id: req.user!.sub, read_at: new Date().toISOString(),
      }));
      res.status(204).end();
    } catch (err) { next(err); }
  });

  app.use('/api/chat', router);

  // Auto-create conversation when job is assigned
  TypedEventBus.subscribe(EVENT_NAMES.JOB_ASSIGNED, async (envelope) => {
    const { clientId, workerId, jobId } = envelope.payload as { clientId: UUID; workerId: UUID; jobId: UUID };
    const existing = await db.client().from('conversations')
      .select('id').eq('job_id', jobId).single();
    if (!existing.data) {
      await db.client().from('conversations').insert({
        id:            generateId(),
        job_id:        jobId,
        participant_a: clientId,
        participant_b: workerId,
        created_at:    new Date().toISOString(),
        updated_at:    new Date().toISOString(),
      });
    }
  });
}
