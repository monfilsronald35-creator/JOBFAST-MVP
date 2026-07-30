import { DomainEvent } from '../../../core/events/DomainEvent.js';
import { EVENT_NAMES } from '@shared-events';
import type { UUID, MinorUnits, Currency } from '@shared-types';

export class JobCreatedEvent extends DomainEvent {
  constructor(
    public readonly jobId:     UUID,
    public readonly clientId:  UUID,
    public readonly title:     string,
    public readonly category:  string,
    public readonly budget:    MinorUnits,
    public readonly currency:  Currency,
  ) { super(EVENT_NAMES.JOB_CREATED); }
}

export class JobAssignedEvent extends DomainEvent {
  constructor(
    public readonly jobId:    UUID,
    public readonly clientId: UUID,
    public readonly workerId: UUID,
  ) { super(EVENT_NAMES.JOB_ASSIGNED); }
}

export class JobStartedEvent extends DomainEvent {
  constructor(public readonly jobId: UUID, public readonly workerId: UUID) {
    super(EVENT_NAMES.JOB_STARTED);
  }
}

export class JobCompletedEvent extends DomainEvent {
  constructor(
    public readonly jobId:    UUID,
    public readonly clientId: UUID,
    public readonly workerId: UUID,
    public readonly budget:   MinorUnits,
    public readonly currency: Currency,
  ) { super(EVENT_NAMES.JOB_COMPLETED); }
}

export class JobCancelledEvent extends DomainEvent {
  constructor(public readonly jobId: UUID, public readonly clientId: UUID, public readonly reason?: string) {
    super(EVENT_NAMES.JOB_CANCELLED);
  }
}

export class JobDisputedEvent extends DomainEvent {
  constructor(public readonly jobId: UUID, public readonly reportedBy: UUID) {
    super(EVENT_NAMES.JOB_DISPUTED);
  }
}
