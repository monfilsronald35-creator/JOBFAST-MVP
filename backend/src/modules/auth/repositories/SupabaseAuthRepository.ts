import type { UUID, Email } from '@shared-types';
import { db } from '../../../core/database/SupabaseClient.js';
import type { IAuthRepository } from './IAuthRepository.js';
import type { ProfileRow } from '../types/index.js';
import type { RegisterDTOType } from '../dto/index.js';
import { generateId, nowMs } from '@shared-utils';

export class SupabaseAuthRepository implements IAuthRepository {
  async findByEmail(email: Email): Promise<ProfileRow | null> {
    return db.queryNullable<ProfileRow>(client =>
      client
        .from('profiles')
        .select('id, email, password_hash, full_name, role, avatar_url, verified_at, created_at, updated_at')
        .eq('email', email.toLowerCase())
        .single(),
    );
  }

  async findById(id: UUID): Promise<ProfileRow | null> {
    return db.queryNullable<ProfileRow>(client =>
      client
        .from('profiles')
        .select('id, email, password_hash, full_name, role, avatar_url, verified_at, created_at, updated_at')
        .eq('id', id)
        .single(),
    );
  }

  async create(dto: RegisterDTOType, passwordHash: string): Promise<ProfileRow> {
    const id  = generateId();
    const now = new Date().toISOString();

    return db.query<ProfileRow>(client =>
      client
        .from('profiles')
        .insert({
          id,
          email:         dto.email.toLowerCase(),
          password_hash: passwordHash,
          full_name:     dto.fullName,
          role:          dto.role,
          phone:         dto.phone,
          locale:        dto.locale,
          created_at:    now,
          updated_at:    now,
        })
        .select()
        .single(),
    );
  }

  async updatePasswordHash(userId: UUID, newHash: string): Promise<void> {
    await db.query(client =>
      client
        .from('profiles')
        .update({ password_hash: newHash, updated_at: new Date().toISOString() })
        .eq('id', userId),
    );
  }

  async markEmailVerified(userId: UUID): Promise<void> {
    await db.query(client =>
      client
        .from('profiles')
        .update({ verified_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', userId),
    );
  }

  async storeResetToken(userId: UUID, token: string, expiresAt: number): Promise<void> {
    await db.query(client =>
      client
        .from('password_reset_tokens')
        .upsert({ user_id: userId, token, expires_at: new Date(expiresAt).toISOString() }),
    );
  }

  async findByResetToken(token: string): Promise<{ userId: UUID; expiresAt: number } | null> {
    const row = await db.queryNullable<{ user_id: UUID; expires_at: string }>(client =>
      client
        .from('password_reset_tokens')
        .select('user_id, expires_at')
        .eq('token', token)
        .single(),
    );
    if (!row) return null;
    return { userId: row.user_id, expiresAt: new Date(row.expires_at).getTime() };
  }

  async clearResetToken(userId: UUID): Promise<void> {
    await db.query(client =>
      client.from('password_reset_tokens').delete().eq('user_id', userId),
    );
  }
}
