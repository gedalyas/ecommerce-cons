import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Informe um e-mail válido")
  .max(120);
export const passwordSchema = z
  .string()
  .min(8, "A senha precisa de pelo menos 8 caracteres")
  .max(200);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Informe a senha").max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Informe o refresh token"),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

export const tokenSchema = z.string().trim().min(1, "Informe o token").max(200);

export const registerSchema = z.object({
  token: tokenSchema,
  name: z.string().trim().min(2, "Informe seu nome").max(80, "No máximo 80 caracteres"),
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const invitationLookupSchema = z.object({ token: tokenSchema });

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({ token: tokenSchema, password: passwordSchema });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const underDevelopmentSearchSchema = z.object({ tela: z.string().catch("") });
export type UnderDevelopmentSearch = z.infer<typeof underDevelopmentSearchSchema>;
