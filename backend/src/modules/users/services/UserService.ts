import type { UUID } from '@shared-types';
import type { IUserRepository } from '../repositories/IUserRepository.js';
import type { User } from '../entities/User.js';
import type { UpdateUserDTOType, UserFilterDTOType } from '../dto/index.js';
import type { PaginatedResult } from '../../_base/IRepository.js';
import { NotFoundError, ForbiddenError } from '../../../core/errors/AppError.js';
import { TypedEventBus } from '../../../core/events/TypedEventBus.js';
import { UserUpdatedEvent, UserSuspendedEvent, UserDeletedEvent, UserVerifiedEvent } from '../events/UserEvents.js';
import { Cache, CacheKeys } from '../../../core/cache/Cache.js';

export class UserService {
  constructor(private readonly _repo: IUserRepository) {}

  async getById(id: UUID): Promise<User> {
    return Cache.getOrSet(CacheKeys.user(id), () => this._repo.findById(id).then(u => {
      if (!u) throw new NotFoundError('Itilizatè', id);
      return u;
    }), 300);
  }

  async listUsers(filter: UserFilterDTOType): Promise<PaginatedResult<User>> {
    return this._repo.findAll(filter);
  }

  async updateProfile(requesterId: UUID, targetId: UUID, dto: UpdateUserDTOType): Promise<User> {
    if (requesterId !== targetId) throw new ForbiddenError('Ou pa ka modifye pwofil yon lòt moun');

    const user = await this._repo.update(targetId, dto);
    Cache.del(CacheKeys.user(targetId));

    TypedEventBus.publish(new UserUpdatedEvent(targetId, Object.keys(dto)));
    return user;
  }

  async suspendUser(adminId: UUID, targetId: UUID, reason?: string): Promise<void> {
    const user = await this._repo.findById(targetId);
    if (!user) throw new NotFoundError('Itilizatè', targetId);

    await this._repo.suspend(targetId);
    Cache.del(CacheKeys.user(targetId));

    TypedEventBus.publish(new UserSuspendedEvent(targetId, reason));
  }

  async activateUser(adminId: UUID, targetId: UUID): Promise<void> {
    await this._repo.activate(targetId);
    Cache.del(CacheKeys.user(targetId));
  }

  async deleteAccount(requesterId: UUID, targetId: UUID): Promise<void> {
    if (requesterId !== targetId) throw new ForbiddenError('Ou pa ka efase kont yon lòt moun');

    await this._repo.delete(targetId);
    Cache.del(CacheKeys.user(targetId));

    TypedEventBus.publish(new UserDeletedEvent(targetId));
  }

  async verifyUser(userId: UUID): Promise<void> {
    const user = await this._repo.findById(userId);
    if (!user) throw new NotFoundError('Itilizatè', userId);

    await this._repo.activate(userId);
    Cache.del(CacheKeys.user(userId));

    TypedEventBus.publish(new UserVerifiedEvent(userId));
  }
}
