import { z } from "zod";
import { adPlatforms, funnelStages } from "./marketing.types";

export const campaignTagSchema = z.object({
  platform: z.enum(adPlatforms, { errorMap: () => ({ message: "Plataforma desconhecida." }) }),
  campaignId: z.string().trim().min(1, "Campanha obrigatória.").max(128),
  stage: z.enum(funnelStages, { errorMap: () => ({ message: "Etapa desconhecida." }) }).nullable(),
  channel: z.string().trim().min(1, "Canal obrigatório.").max(64),
});
export type CampaignTagInput = z.infer<typeof campaignTagSchema>;
