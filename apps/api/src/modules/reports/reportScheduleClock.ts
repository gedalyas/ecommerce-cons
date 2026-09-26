import type { ReportFrequency } from "@ecommerce/contracts/reports";

export type LocalClock = { day: string; weekday: number; monthDay: number; hour: number };

export type DueFacts = {
  enabled: boolean;
  frequency: ReportFrequency;
  weekday: number | null;
  monthDay: number | null;
  hour: number;
  lastSentAt: Date | null;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function localClockOf(now: Date, timeZone: string): LocalClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return {
    day: `${part("year")}-${part("month")}-${part("day")}`,
    weekday: WEEKDAYS.indexOf(part("weekday")) + 1,
    monthDay: Number(part("day")),
    hour: Number(part("hour")),
  };
}

export const slotOf = (clock: LocalClock) => `${clock.day}T${String(clock.hour).padStart(2, "0")}`;

export function isDue(schedule: DueFacts, now: Date, timeZone: string): boolean {
  if (!schedule.enabled) return false;
  const clock = localClockOf(now, timeZone);
  if (clock.hour !== schedule.hour) return false;
  const rightDay =
    schedule.frequency === "WEEKLY"
      ? clock.weekday === schedule.weekday
      : clock.monthDay === schedule.monthDay;
  if (!rightDay) return false;
  return (
    !schedule.lastSentAt || slotOf(localClockOf(schedule.lastSentAt, timeZone)) !== slotOf(clock)
  );
}
