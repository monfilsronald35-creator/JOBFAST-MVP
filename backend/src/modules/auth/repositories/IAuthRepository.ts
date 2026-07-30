import type { UUID, Email } from '@shared-types';
import type { ProfileRow } from '../types/index.js';
import type { RegisterDTOType } from '../dto/index.js';

export interface IAuthRepository {
  findByEmail(email: Email): Promise<ProfileRow | null>;
  findById(id: UUID): Promise<ProfileRow | null>;
  create(dto: RegisterDTOType, passwordHash: string): Promise<ProfileRow>;
  updatePasswordHash(userId: UUID, newHash: string): Promise<void>;
  markEmailVerified(userId: UUID): Promise<void>;
  storeResetToken(userId: UUID, token: string, expiresAt: number): Promise<void>;
  findByResetToken(token: string): Promise<{ userId: UUID; expiresAt: number } | null>;
  clearResetToken(userId: UUID): Promise<void>;
}
