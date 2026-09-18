import { z } from "zod";
import { accessAreas, accessLevels } from "../auth/accessAreas";
import { emailSchema } from "../auth/authSchema";

export const areaGrantSchema = z.object({
  area: z.enum(accessAreas),
  level: z.enum(accessLevels),
});

export const grantsSchema = z
  .array(areaGrantSchema)
  .min(1, "Libere pelo menos uma área")
  .max(accessAreas.length)
  .refine(
    (grants) => new Set(grants.map((g) => g.area)).size === grants.length,
    "Cada área aparece uma vez",
  );

export const teamInviteSchema = z.object({
  email: emailSchema,
  grants: grantsSchema,
});
export type TeamInviteInput = z.infer<typeof teamInviteSchema>;

export const teamMemberUpdateSchema = z.object({ grants: grantsSchema });
export type TeamMemberUpdateInput = z.infer<typeof teamMemberUpdateSchema>;

export const teamIdSchema = z.object({ id: z.string().min(1) });
