import { z } from "zod";
import {
  MAX_SCHEDULE_DAY,
  MAX_SCHEDULE_RECIPIENTS,
  reportFrequencies,
} from "./reportSchedule.types";
import { reportSectionKeys } from "./reports.types";

const DEL = 127;
const FIRST_PRINTABLE = 32;

const isControlCharacter = (char: string) => {
  const code = char.charCodeAt(0);
  return code < FIRST_PRINTABLE || code === DEL;
};

export const reportScheduleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Dê um nome à automação.")
      .max(80, "Nome longo demais.")
      .refine(
        (name) => ![...name].some(isControlCharacter),
        "Use só letras, números e pontuação no nome.",
      ),
    sections: z
      .array(z.enum(reportSectionKeys, { message: "Seção desconhecida." }))
      .min(1, "Escolha ao menos uma seção.")
      .max(reportSectionKeys.length),
    frequency: z.enum(reportFrequencies),
    weekday: z.number().int().min(1).max(7).nullable().default(null),
    monthDay: z.number().int().min(1).max(MAX_SCHEDULE_DAY).nullable().default(null),
    hour: z.number().int().min(0, "Hora inválida.").max(23, "Hora inválida."),
    recipientIds: z
      .array(z.string().min(1).max(64))
      .min(1, "Escolha ao menos um destinatário.")
      .max(MAX_SCHEDULE_RECIPIENTS, "Destinatários demais."),
    enabled: z.boolean().default(true),
  })
  .refine((s) => s.frequency !== "WEEKLY" || s.weekday !== null, {
    path: ["weekday"],
    message: "Escolha o dia da semana.",
  })
  .refine((s) => s.frequency !== "MONTHLY" || s.monthDay !== null, {
    path: ["monthDay"],
    message: "Escolha o dia do mês.",
  });
export type ReportScheduleInput = z.infer<typeof reportScheduleSchema>;

export const reportScheduleIdSchema = z.object({ id: z.string().min(1).max(64) });
