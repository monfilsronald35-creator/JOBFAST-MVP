import { z } from 'zod';
import { zEmail, zPassword, zName } from '@shared-validation';

export const LoginDTO = z.object({
  email:    zEmail,
  password: zPassword,
});

export const RegisterDTO = z.object({
  email:    zEmail,
  password: zPassword,
  fullName: zName,
  role:     z.enum(['worker', 'client', 'business']).default('client'),
  phone:    z.string().optional(),
  locale:   z.enum(['ht', 'fr', 'en', 'es', 'pt']).default('ht'),
});

export const RefreshTokenDTO = z.object({
  refreshToken: z.string().min(10),
});

export const ChangePasswordDTO = z.object({
  currentPassword: zPassword,
  newPassword:     zPassword,
}).refine(d => d.currentPassword !== d.newPassword, {
  message: 'Nouvo modpas dwe diferan de ansyen an',
  path:    ['newPassword'],
});

export const ForgotPasswordDTO = z.object({
  email: zEmail,
});

export const ResetPasswordDTO = z.object({
  token:       z.string().min(10),
  newPassword: zPassword,
});

export type LoginDTOType          = z.infer<typeof LoginDTO>;
export type RegisterDTOType       = z.infer<typeof RegisterDTO>;
export type RefreshTokenDTOType   = z.infer<typeof RefreshTokenDTO>;
export type ChangePasswordDTOType = z.infer<typeof ChangePasswordDTO>;
