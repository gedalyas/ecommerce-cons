import { z } from "zod";
import { emailSchema } from "../auth/authSchema";

export const invitationInputSchema = z.object({
  email: emailSchema,
  role: z.enum(["CLIENT", "CONSULTANT"]),
  clientId: z.string().min(1).nullable().default(null),
});
export type InvitationInput = z.infer<typeof invitationInputSchema>;

export const adminUsersSearchSchema = z.object({
  busca: z.string().catch(""),
  consultor: z.string().catch(""),
});
export type AdminUsersSearch = z.infer<typeof adminUsersSearchSchema>;

export const assignConsultantsSchema = z.object({
  consultantIds: z.array(z.string().min(1)).max(20),
});
export type AssignConsultantsInput = z.infer<typeof assignConsultantsSchema>;
