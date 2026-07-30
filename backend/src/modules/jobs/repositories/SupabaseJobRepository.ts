import type { UUID } from '@shared-types';
import { db } from '../../../core/database/SupabaseClient.js';
import type { IJobRepository } from './IJobRepository.js';
import { Job } from '../entities/Job.js';
import type { CreateJobDTOType, UpdateJobDTOType, JobFilterDTOType } from '../dto/index.js';
import type { PaginatedResult } from '../../_base/IRepository.js';
import { generateId } from '@shared-utils';

const JOB_SELECT = 'id, client_id, worker_id, title, description, category, subcategory, skills, budget, currency, status, location, is_remote, urgency, estimated_hours, assigned_at, started_at, completed_at, cancelled_at, created_at, updated_at';

export class SupabaseJobRepository implements IJobRepository {
  async findById(id: UUID): Promise<Job | null> {
    const row = await db.queryNullable<Record<string, unknown>>(c =>
      c.from('jobs').select(JOB_SELECT).eq('id', id).single(),
    );
    return row ? Job.fromRow(row) : null;
  }

  async findAll(filter: JobFilterDTOType): Promise<PaginatedResult<Job>> {
    let q = db.client().from('jobs').select(JOB_SELECT, { count: 'exact' });

    if (filter.category) q = q.eq('category', filter.category);
    if (filter.status)   q = q.eq('status',   filter.status);
    if (filter.clientId) q = q.eq('client_id', filter.clientId);
    if (filter.workerId) q = q.eq('worker_id', filter.workerId);
    if (filter.isRemote !== undefined) q = q.eq('is_remote', filter.isRemote);
    if (filter.minBudget !== undefined) q = q.gte('budget', filter.minBudget);
    if (filter.maxBudget !== undefined) q = q.lte('budget', filter.maxBudget);
    if (filter.currency) q = q.eq('currency', filter.currency);
    if (filter.skill)    q = q.contains('skills', [filter.skill]);
    if (filter.cursor)   q = q.lt('created_at', new Date(Number(filter.cursor)).toISOString());

    q = q.order('created_at', { ascending: false }).limit(filter.limit);

    const { data, error, count } = await q;
    if (error) throw error;

    const items      = (data ?? []).map(r => Job.fromRow(r as Record<string, unknown>));
    const last       = items.at(-1);
    const nextCursor = last && items.length === filter.limit ? String(last.createdAt) : undefined;

    return { items, nextCursor, total: count ?? undefined };
  }

  async create(clientId: UUID, dto: CreateJobDTOType): Promise<Job> {
    const now = new Date().toISOString();
    const row = await db.query<Record<string, unknown>>(c =>
      c.from('jobs').insert({
        id:             generateId(),
        client_id:      clientId,
        title:          dto.title,
        description:    dto.description,
        category:       dto.category,
        subcategory:    dto.subcategory,
        skills:         dto.skills,
        budget:         dto.budget,
        currency:       dto.currency,
        status:         'open',
        is_remote:      dto.isRemote,
        location:       dto.location,
        urgency:        dto.urgency,
        estimated_hours: dto.estimatedHours,
        created_at:     now,
        updated_at:     now,
      }).select(JOB_SELECT).single(),
    );
    return Job.fromRow(row);
  }

  async update(id: UUID, dto: UpdateJobDTOType): Promise<Job> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.title       !== undefined) patch['title']       = dto.title;
    if (dto.description !== undefined) patch['description'] = dto.description;
    if (dto.budget      !== undefined) patch['budget']      = dto.budget;
    if (dto.urgency     !== undefined) patch['urgency']     = dto.urgency;

    const row = await db.query<Record<string, unknown>>(c =>
      c.from('jobs').update(patch).eq('id', id).select(JOB_SELECT).single(),
    );
    return Job.fromRow(row);
  }

  async delete(id: UUID): Promise<void> {
    await db.query(c => c.from('jobs').delete().eq('id', id));
  }

  async setStatus(id: UUID, status: Job['status'], extra?: Record<string, unknown>): Promise<void> {
    await db.query(c =>
      c.from('jobs').update({ status, updated_at: new Date().toISOString(), ...extra }).eq('id', id),
    );
  }

  async assign(id: UUID, workerId: UUID): Promise<void> {
    await this.setStatus(id, 'assigned', { worker_id: workerId, assigned_at: new Date().toISOString() });
  }

  async exists(id: UUID): Promise<boolean> {
    const { count } = await db.client().from('jobs').select('id', { count: 'exact', head: true }).eq('id', id);
    return (count ?? 0) > 0;
  }
}
