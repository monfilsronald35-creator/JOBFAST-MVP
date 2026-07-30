/**
 * JobChannel — live job feed, instant match, applications, hiring status, availability.
 */

import { BaseChannel } from './BaseChannel';
import type { RealtimeEngine } from '../core/RealtimeEngine';
import type {
  LiveJobPayload, JobMatchPayload,
  ApplicationUpdatePayload, AvailabilityPayload,
} from '../types';

export class JobChannel extends BaseChannel {
  constructor(engine: RealtimeEngine) {
    super(engine, 'jobs');
  }

  // ── Subscriptions ───────────────────────────────────────────────────────────

  subscribeToFeed(filters?: {
    category?: string;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    minBudget?: number;
  }): void {
    this.engine.emit('jobs:feed:subscribe', filters ?? {}, 'normal');
  }

  unsubscribeFromFeed(): void {
    this.engine.emit('jobs:feed:unsubscribe', {}, 'normal');
  }

  subscribeToJob(jobId: string): void {
    this.engine.emit('jobs:subscribe', { jobId }, 'normal');
    this.joinRoom(`job:${jobId}`);
  }

  unsubscribeFromJob(jobId: string): void {
    this.engine.emit('jobs:unsubscribe', { jobId }, 'normal');
    this.leaveRoom(`job:${jobId}`);
  }

  subscribeToMyApplications(userId: string): void {
    this.engine.emit('jobs:applications:subscribe', { userId }, 'normal');
  }

  // ── Inbound ─────────────────────────────────────────────────────────────────

  onNewJob(handler: (job: LiveJobPayload) => void): () => void {
    return this.onGlobal('jobs:new', handler);
  }

  onJobUpdated(handler: (job: Partial<LiveJobPayload> & { _id: string }) => void): () => void {
    return this.onGlobal('jobs:updated', handler);
  }

  onJobClosed(handler: (data: { jobId: string; reason: string }) => void): () => void {
    return this.onGlobal('jobs:closed', handler);
  }

  onInstantMatch(handler: (match: JobMatchPayload) => void): () => void {
    return this.onGlobal('jobs:match', handler);
  }

  onApplicationUpdate(handler: (update: ApplicationUpdatePayload) => void): () => void {
    return this.onGlobal('jobs:application:update', handler);
  }

  onHiringStatus(handler: (data: { jobId: string; workerId: string; status: 'hired' | 'rejected' }) => void): () => void {
    return this.onGlobal('jobs:hiring:status', handler);
  }

  onApplicantCountUpdate(handler: (data: { jobId: string; count: number }) => void): () => void {
    return this.onGlobal('jobs:applicants:count', handler);
  }

  // ── Outbound ────────────────────────────────────────────────────────────────

  publishAvailability(payload: AvailabilityPayload): void {
    this.engine.emit('jobs:availability:update', payload, 'high');
  }

  applyToJob(jobId: string, applicantId: string, message?: string): void {
    this.engine.emit('jobs:apply', { jobId, applicantId, message }, 'critical');
  }

  updateHiringStatus(jobId: string, applicantId: string, status: ApplicationUpdatePayload['status']): void {
    this.engine.emit('jobs:hiring:update', { jobId, applicantId, status }, 'high');
  }

  // ── Worker availability broadcast ───────────────────────────────────────────

  onAvailabilityUpdate(handler: (payload: AvailabilityPayload) => void): () => void {
    return this.onGlobal('jobs:availability:update', handler);
  }
}