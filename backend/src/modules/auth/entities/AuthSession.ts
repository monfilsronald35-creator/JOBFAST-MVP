import type { UUID, Email, UserRole, UnixMs } from '@shared-types';
import { randomUUID } from 'crypto';

export class AuthSession {
  readonly sessionId:  UUID;
  readonly userId:     UUID;
  readonly email:      Email;
  readonly role:       UserRole;
  readonly issuedAt:   UnixMs;
  readonly expiresAt:  UnixMs;
  private _invalidated = false;

  constructor(params: {
    userId:    UUID;
    email:     Email;
    role:      UserRole;
    expiresAt: UnixMs;
  }) {
    this.sessionId = randomUUID();
    this.userId    = params.userId;
    this.email     = params.email;
    this.role      = params.role as UserRole;
    this.issuedAt  = Date.now();
    this.expiresAt = params.expiresAt;
  }

  isExpired(): boolean {
    return Date.now() > this.expiresAt;
  }

  isValid(): boolean {
    return !this._invalidated && !this.isExpired();
  }

  invalidate(): void {
    this._invalidated = true;
  }
}
