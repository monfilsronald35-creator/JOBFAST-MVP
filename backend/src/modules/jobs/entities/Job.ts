import type { UUID, JobStatus, MinorUnits, Currency, UnixMs, GeoAddress } from '@shared-types';
import { randomUUID } from 'crypto';

export class Job {
  readonly id:          UUID;
  readonly clientId:    UUID;
  workerId?:            UUID;
  title:                string;
  description:          string;
  category:             string;
  subcategory?:         string;
  skills:               string[];
  budget:               MinorUnits;
  currency:             Currency;
  status:               JobStatus;
  location?:            GeoAddress;
  isRemote:             boolean;
  images?:              string[];
  urgency:              'low' | 'normal' | 'high' | 'urgent';
  estimatedHours?:      number;
  assignedAt?:          UnixMs;
  startedAt?:           UnixMs;
  completedAt?:         UnixMs;
  cancelledAt?:         UnixMs;
  readonly createdAt:   UnixMs;
  updatedAt:            UnixMs;

  constructor(params: {
    id?:          UUID;
    clientId:     UUID;
    title:        string;
    description:  string;
    category:     string;
    budget:       MinorUnits;
    currency:     Currency;
    isRemote?:    boolean;
    location?:    GeoAddress;
    skills?:      string[];
    urgency?:     'low' | 'normal' | 'high' | 'urgent';
    estimatedHours?: number;
  }) {
    this.id           = params.id ?? randomUUID();
    this.clientId     = params.clientId;
    this.title        = params.title;
    this.description  = params.description;
    this.category     = params.category;
    this.budget       = params.budget;
    this.currency     = params.currency;
    this.status       = 'open';
    this.skills       = params.skills ?? [];
    this.isRemote     = params.isRemote ?? false;
    this.location     = params.location;
    this.urgency      = params.urgency ?? 'normal';
    this.estimatedHours = params.estimatedHours;
    this.createdAt    = Date.now();
    this.updatedAt    = Date.now();
  }

  assign(workerId: UUID): void {
    if (this.status !== 'open') throw new Error(`Travay la pa disponib (${this.status})`);
    this.workerId   = workerId;
    this.status     = 'assigned';
    this.assignedAt = Date.now();
    this.updatedAt  = Date.now();
  }

  start(): void {
    if (this.status !== 'assigned') throw new Error('Travay la pa asiyene');
    this.status    = 'in_progress';
    this.startedAt = Date.now();
    this.updatedAt = Date.now();
  }

  complete(): void {
    if (this.status !== 'in_progress') throw new Error('Travay la pa kòmanse');
    this.status      = 'completed';
    this.completedAt = Date.now();
    this.updatedAt   = Date.now();
  }

  cancel(): void {
    if (['completed', 'cancelled'].includes(this.status)) {
      throw new Error('Travay la deja fini oswa kanpe');
    }
    this.status      = 'cancelled';
    this.cancelledAt = Date.now();
    this.updatedAt   = Date.now();
  }

  dispute(): void {
    this.status    = 'disputed';
    this.updatedAt = Date.now();
  }

  static fromRow(row: Record<string, unknown>): Job {
    const job = new Job({
      id:          row['id'] as UUID,
      clientId:    row['client_id'] as UUID,
      title:       row['title'] as string,
      description: row['description'] as string,
      category:    row['category'] as string,
      budget:      row['budget'] as MinorUnits,
      currency:    (row['currency'] ?? 'HTG') as Currency,
    });
    Object.assign(job, {
      workerId:     row['worker_id'],
      subcategory:  row['subcategory'],
      skills:       row['skills'] ?? [],
      status:       row['status'],
      isRemote:     row['is_remote'],
      location:     row['location'],
      urgency:      row['urgency'] ?? 'normal',
      estimatedHours: row['estimated_hours'],
      assignedAt:   row['assigned_at']  ? new Date(row['assigned_at']  as string).getTime() : undefined,
      startedAt:    row['started_at']   ? new Date(row['started_at']   as string).getTime() : undefined,
      completedAt:  row['completed_at'] ? new Date(row['completed_at'] as string).getTime() : undefined,
      cancelledAt:  row['cancelled_at'] ? new Date(row['cancelled_at'] as string).getTime() : undefined,
      createdAt:    new Date(row['created_at'] as string).getTime(),
      updatedAt:    new Date(row['updated_at'] as string).getTime(),
    });
    return job;
  }
}
