import type { UUID } from '@shared-types';
import type { User } from '../entities/User.js';
import type { UpdateUserDTOType, UserFilterDTOType } from '../dto/index.js';
import type { PaginatedResult } from '../../_base/IRepository.js';

export interface IUserRepository {
  findById(id: UUID): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(filter: UserFilterDTOType): Promise<PaginatedResult<User>>;
  update(id: UUID, dto: UpdateUserDTOType): Promise<User>;
  suspend(id: UUID): Promise<void>;
  activate(id: UUID): Promise<void>;
  delete(id: UUID): Promise<void>;
  exists(id: UUID): Promise<boolean>;
}
