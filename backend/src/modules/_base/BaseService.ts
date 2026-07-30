import type { TypedEventBusImpl } from '../../core/events/TypedEventBus.js';

export abstract class BaseService {
  constructor(
    protected readonly _eventBus: InstanceType<typeof import('../../core/events/TypedEventBus.js').TypedEventBus.constructor>,
  ) {}
}
