import { DomainEvent } from '../../../core/events/DomainEvent.js';
import { EVENT_NAMES } from '@shared-events';
import type { UUID, Email, UserRole } from '@shared-types';

export class UserLoggedInEvent extends DomainEvent {
  constructor(
    public readonly userId: UUID,
    public readonly email:  Email,
    public readonly role:   UserRole,
    public readonly ip?:    string,
  ) {
    super(EVENT_NAMES.AUTH_LOGIN);
  }
}

export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId:   UUID,
    public readonly email:    Email,
    public readonly role:     UserRole,
    public readonly fullName: string,
  ) {
    super(EVENT_NAMES.USER_REGISTERED);
  }
}

export class UserLoggedOutEvent extends DomainEvent {
  constructor(public readonly userId: UUID) {
    super(EVENT_NAMES.AUTH_LOGOUT);
  }
}

export class PasswordChangedEvent extends DomainEvent {
  constructor(public readonly userId: UUID) {
    super(EVENT_NAMES.AUTH_PASSWORD_CHANGED);
  }
}
