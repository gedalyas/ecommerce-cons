import { z } from "zod";
import { storeScreens } from "../auth/contract";
import { channels, isIsoDate, rangeLength } from "../shared/period";
import { assistantRoles } from "./assistant.types";

export const ASSISTANT_MAX_MESSAGES = 12;
export const ASSISTANT_MAX_TEXT = 2000;
const MAX_PERIOD_DAYS = 366;
const isoDate = z.string().refine(isIsoDate, "Data inválida.");

const assistantMessageSchema = z.object({
  role: z.enum(assistantRoles),
  text: z
    .string()
    .trim()
    .min(1, "Escreva uma pergunta.")
    .max(ASSISTANT_MAX_TEXT, "A mensagem passa de 2.000 caracteres."),
});

export const assistantRequestSchema = z
  .object({
    messages: z
      .array(assistantMessageSchema)
      .min(1, "Escreva uma pergunta.")
      .max(ASSISTANT_MAX_MESSAGES, "A conversa ficou longa demais. Limpe e comece de novo.")
      .refine((messages) => messages.at(-1)?.role === "user", "A última mensagem é a pergunta."),
    inicio: isoDate,
    fim: isoDate,
    canal: z.enum(channels).default("todos"),
    screen: z.enum(storeScreens).nullable().default(null),
  })
  .refine((request) => request.inicio <= request.fim, {
    path: ["fim"],
    message: "O fim do período vem antes do início.",
  })
  .refine((request) => rangeLength(request) <= MAX_PERIOD_DAYS, {
    path: ["inicio"],
    message: "O período cobre no máximo um ano.",
  });
export type AssistantRequest = z.infer<typeof assistantRequestSchema>;
