import { z } from "zod";

export const activityQuerySchema = z.object({
  pagina: z.coerce.number().int().min(1).catch(1),
  storeId: z.string().min(1).nullable().catch(null),
});
export type ActivityQuery = z.infer<typeof activityQuerySchema>;
