import type { ReportFrequency, ReportSchedule } from "./reportSchedule.types";
import { weekdayNames } from "./reportSchedule.types";
import type { ReportTemplate } from "./reports.types";

export const templateOfFrequency: Record<ReportFrequency, ReportTemplate> = {
  WEEKLY: "weekly",
  MONTHLY: "monthly",
};

export function scheduleLabel(
  schedule: Pick<ReportSchedule, "frequency" | "weekday" | "monthDay" | "hour">,
): string {
  const hour = `${schedule.hour}h`;
  if (schedule.frequency === "WEEKLY") {
    const day = weekdayNames[(schedule.weekday ?? 1) - 1] ?? weekdayNames[0];
    const every = day === "sábado" || day === "domingo" ? "Todo" : "Toda";
    return `${every} ${day} às ${hour}`;
  }
  return `Todo dia ${schedule.monthDay ?? 1} às ${hour}`;
}
