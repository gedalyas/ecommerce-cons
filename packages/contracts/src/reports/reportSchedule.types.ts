import type { ReportSectionKey } from "./reports.types";

export const reportFrequencies = ["WEEKLY", "MONTHLY"] as const;
export type ReportFrequency = (typeof reportFrequencies)[number];

export const reportFrequencyLabel: Record<ReportFrequency, string> = {
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
};

export const weekdayNames = [
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
  "domingo",
] as const;

export const MAX_SCHEDULE_DAY = 28;
export const MAX_SCHEDULE_RECIPIENTS = 20;
export const MAX_SCHEDULES_PER_USER = 10;

export type ReportRecipient = { id: string; name: string; email: string };

export type ReportSchedule = {
  id: string;
  name: string;
  sections: ReportSectionKey[];
  frequency: ReportFrequency;
  weekday: number | null;
  monthDay: number | null;
  hour: number;
  recipientIds: string[];
  enabled: boolean;
  lastSentAt: string | null;
};

export type ReportSchedulesScreen = {
  schedules: ReportSchedule[];
  recipients: ReportRecipient[];
};
