import {
  MAX_SCHEDULE_DAY,
  weekdayNames,
  type ReportFrequency,
  type ReportSchedule,
  type ReportScheduleInput,
  type ReportSectionKey,
} from "@ecommerce/contracts/reports";

const DEFAULT_HOUR = 8;

export type Option = { value: string; label: string };

export const hourOptions: Option[] = Array.from({ length: 24 }, (_, hour) => ({
  value: String(hour),
  label: `${hour}h`,
}));

export function dayOptions(frequency: ReportFrequency): Option[] {
  if (frequency === "WEEKLY") {
    return weekdayNames.map((name, i) => ({ value: String(i + 1), label: name }));
  }
  return Array.from({ length: MAX_SCHEDULE_DAY }, (_, i) => ({
    value: String(i + 1),
    label: `Dia ${i + 1}`,
  }));
}

export function draftOf(
  schedule: ReportSchedule | null,
  sections: ReportSectionKey[],
  meId: string,
): ReportScheduleInput {
  if (schedule) {
    const { id: _id, lastSentAt: _lastSentAt, ...draft } = schedule;
    return draft;
  }
  return {
    name: "Reunião semanal",
    sections,
    frequency: "WEEKLY",
    weekday: 1,
    monthDay: null,
    hour: DEFAULT_HOUR,
    recipientIds: [meId],
    enabled: true,
  };
}

export function withFrequency(
  draft: ReportScheduleInput,
  frequency: ReportFrequency,
): ReportScheduleInput {
  return frequency === "WEEKLY"
    ? { ...draft, frequency, weekday: draft.weekday ?? 1, monthDay: null }
    : { ...draft, frequency, monthDay: draft.monthDay ?? 1, weekday: null };
}
