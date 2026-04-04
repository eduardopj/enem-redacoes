import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Informe o e-mail').email('Digite um e-mail válido'),
  password: z
    .string()
    .min(1, 'Informe a senha')
    .min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

export const signupSchema = z
  .object({
    name: z.string().min(1, 'Informe seu nome').min(3, 'Digite o nome completo'),
    email: z.string().min(1, 'Informe o e-mail').email('Digite um e-mail válido'),
    password: z
      .string()
      .min(1, 'Informe a senha')
      .min(6, 'A senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirme a senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;