import { z } from 'zod';

export const RegisterTeacherSchema = z.object({
  teacherId:    z.string().min(1).max(100),
  teacherEmail: z.string().max(254).optional().or(z.literal('')),
  teacherName:  z.string().min(1).max(200),
  passwordHash: z.string().length(64).optional(), // SHA-256 hex from client
});

export const LoginSchema = z.object({
  email:        z.string().email().max(254),
  passwordHash: z.string().length(64), // SHA-256 hex from client
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email().max(254),
});

export const ResetPasswordSchema = z.object({
  email:           z.string().email().max(254),
  code:            z.string().length(6).regex(/^\d{6}$/, 'Código deve ter 6 dígitos.'),
  newPasswordHash: z.string().length(64), // SHA-256 hex of new password from client
});

export type RegisterTeacherInput = z.infer<typeof RegisterTeacherSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
