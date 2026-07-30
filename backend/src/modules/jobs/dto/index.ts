import { z } from 'zod';
import { zUUID, zMoneyAmount, zCurrency, zCursorPagination, zGeoPoint } from '@shared-validation';

const zLocation = zGeoPoint.extend({
  address:   z.string().max(500),
  city:      z.string().max(100).optional(),
  country:   z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
});

export const CreateJobDTO = z.object({
  title:          z.string().min(5).max(200),
  description:    z.string().min(20).max(5000),
  category:       z.string().min(2).max(100),
  subcategory:    z.string().max(100).optional(),
  skills:         z.array(z.string().max(50)).max(20).default([]),
  budget:         zMoneyAmount,
  currency:       zCurrency.default('HTG'),
  isRemote:       z.boolean().default(false),
  location:       zLocation.optional(),
  urgency:        z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  estimatedHours: z.number().int().positive().max(10000).optional(),
});

export const UpdateJobDTO = z.object({
  title:       z.string().min(5).max(200).optional(),
  description: z.string().min(20).max(5000).optional(),
  budget:      zMoneyAmount.optional(),
  urgency:     z.enum(['low', 'normal', 'high', 'urgent']).optional(),
}).strict();

export const JobFilterDTO = zCursorPagination.extend({
  category:  z.string().optional(),
  status:    z.enum(['draft', 'open', 'assigned', 'in_progress', 'completed', 'cancelled']).optional(),
  clientId:  zUUID.optional(),
  workerId:  zUUID.optional(),
  isRemote:  z.coerce.boolean().optional(),
  minBudget: z.coerce.number().optional(),
  maxBudget: z.coerce.number().optional(),
  currency:  zCurrency.optional(),
  country:   z.string().optional(),
  skill:     z.string().optional(),
});

export const AssignJobDTO = z.object({
  workerId: zUUID,
});

export type CreateJobDTOType = z.infer<typeof CreateJobDTO>;
export type UpdateJobDTOType = z.infer<typeof UpdateJobDTO>;
export type JobFilterDTOType = z.infer<typeof JobFilterDTO>;
