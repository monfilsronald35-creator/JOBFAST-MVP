import { randomUUID } from 'crypto';

export abstract class DomainEvent {
  readonly eventId:    string;
  readonly occurredAt: number;   // Unix ms UTC
  readonly eventName:  string;
  readonly version:    number;

  constructor(eventName: string, version = 1) {
    this.eventId    = randomUUID();
    this.occurredAt = Date.now();
    this.eventName  = eventName;
    this.version    = version;
  }
}

export interface EventEnvelope<T extends DomainEvent = DomainEvent> {
  eventId:    string;
  eventName:  string;
  occurredAt: number;
  version:    number;
  payload:    T;
  metadata?:  Record<string, unknown>;
}
