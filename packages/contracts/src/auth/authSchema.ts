import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido").max(120),
  password: z.string().min(1, "Informe a senha").max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Informe o refresh token"),
});
export type RefreshInput = z.infer<typeof refreshSchema>;
