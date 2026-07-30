import { z } from 'zod';
import { zName, zPhone, zUrl, zLocale } from '@shared-validation';

export const UpdateUserDTO = z.object({
  fullName:  zName.optional(),
  phone:     zPhone.optional(),
  avatarUrl: zUrl.optional(),
  bio:       z.string().max(2000).optional(),
  country:   z.string().max(100).optional(),
  city:      z.string().max(100).optional(),
  skills:    z.array(z.string().max(50)).max(30).optional(),
  locale:    zLocale.optional(),
}).strict();

export const UserFilterDTO = z.object({
  role:     z.enum(['worker', 'client', 'business', 'admin']).optional(),
  status:   z.enum(['active', 'suspended', 'pending_verification']).optional(),
  country:  z.string().optional(),
  skill:    z.string().optional(),
  cursor:   z.string().optional(),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
});

export type UpdateUserDTOType = z.infer<typeof UpdateUserDTO>;
export type UserFilterDTOType = z.infer<typeof UserFilterDTO>;
