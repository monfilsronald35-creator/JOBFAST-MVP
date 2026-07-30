import { DomainEvent } from '../../../core/events/DomainEvent.js';
import { EVENT_NAMES } from '@shared-events';
import type { UUID } from '@shared-types';

export class UserUpdatedEvent extends DomainEvent {
  constructor(public readonly userId: UUID, public readonly fields: string[]) {
    super(EVENT_NAMES.USER_UPDATED);
  }
}

export class UserVerifiedEvent extends DomainEvent {
  constructor(public readonly userId: UUID) {
    super(EVENT_NAMES.USER_VERIFIED);
  }
}

export class UserSuspendedEvent extends DomainEvent {
  constructor(public readonly userId: UUID, public readonly reason?: string) {
    super(EVENT_NAMES.USER_SUSPENDED);
  }
}

export class UserDeletedEvent extends DomainEvent {
  constructor(public readonly userId: UUID) {
    super(EVENT_NAMES.USER_DELETED);
  }
}
