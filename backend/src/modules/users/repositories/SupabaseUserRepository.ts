import type { UUID } from '@shared-types';
import { db } from '../../../core/database/SupabaseClient.js';
import type { IUserRepository } from './IUserRepository.js';
import { User } from '../entities/User.js';
import type { UpdateUserDTOType, UserFilterDTOType } from '../dto/index.js';
import type { PaginatedResult } from '../../_base/IRepository.js';

const USER_SELECT = 'id, email, full_name, role, status, locale, phone, avatar_url, bio, country, city, skills, verified_at, created_at, updated_at';

export class SupabaseUserRepository implements IUserRepository {
  async findById(id: UUID): Promise<User | null> {
    const row = await db.queryNullable<Record<string, unknown>>(c =>
      c.from('profiles').select(USER_SELECT).eq('id', id).single(),
    );
    return row ? User.fromRow(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await db.queryNullable<Record<string, unknown>>(c =>
      c.from('profiles').select(USER_SELECT).eq('email', email.toLowerCase()).single(),
    );
    return row ? User.fromRow(row) : null;
  }

  async findAll(filter: UserFilterDTOType): Promise<PaginatedResult<User>> {
    let q = db.client().from('profiles').select(USER_SELECT, { count: 'exact' });

    if (filter.role)    q = q.eq('role',    filter.role);
    if (filter.status)  q = q.eq('status',  filter.status);
    if (filter.country) q = q.eq('country', filter.country);
    if (filter.skill)   q = q.contains('skills', [filter.skill]);
    if (filter.cursor)  q = q.lt('created_at', new Date(Number(filter.cursor)).toISOString());

    q = q.order('created_at', { ascending: false }).limit(filter.limit);

    const { data, error, count } = await q;
    if (error) throw error;

    const items      = (data ?? []).map(r => User.fromRow(r as Record<string, unknown>));
    const last       = items.at(-1);
    const nextCursor = last && items.length === filter.limit
      ? String(last.createdAt)
      : undefined;

    return { items, nextCursor, total: count ?? undefined };
  }

  async update(id: UUID, dto: UpdateUserDTOType): Promise<User> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.fullName  !== undefined) patch['full_name']  = dto.fullName;
    if (dto.phone     !== undefined) patch['phone']      = dto.phone;
    if (dto.avatarUrl !== undefined) patch['avatar_url'] = dto.avatarUrl;
    if (dto.bio       !== undefined) patch['bio']        = dto.bio;
    if (dto.country   !== undefined) patch['country']    = dto.country;
    if (dto.city      !== undefined) patch['city']       = dto.city;
    if (dto.skills    !== undefined) patch['skills']     = dto.skills;
    if (dto.locale    !== undefined) patch['locale']     = dto.locale;

    const row = await db.query<Record<string, unknown>>(c =>
      c.from('profiles').update(patch).eq('id', id).select(USER_SELECT).single(),
    );
    return User.fromRow(row);
  }

  async suspend(id: UUID): Promise<void> {
    await db.query(c =>
      c.from('profiles').update({ status: 'suspended', updated_at: new Date().toISOString() }).eq('id', id),
    );
  }

  async activate(id: UUID): Promise<void> {
    await db.query(c =>
      c.from('profiles').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', id),
    );
  }

  async delete(id: UUID): Promise<void> {
    await db.query(c =>
      c.from('profiles').update({ status: 'deleted', updated_at: new Date().toISOString() }).eq('id', id),
    );
  }

  async exists(id: UUID): Promise<boolean> {
    const { count } = await db.client().from('profiles').select('id', { count: 'exact', head: true }).eq('id', id);
    return (count ?? 0) > 0;
  }
}
