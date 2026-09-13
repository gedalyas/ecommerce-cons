import type { DataSourceStatus } from "@/generated/prisma/enums";
import { formatDate } from "@/shared/utils/format";

const DAY_MS = 86_400_000;

const isoDay = (date: Date) => date.toISOString().slice(0, 10);
const isoTime = (date: Date) => date.toISOString().slice(11, 16);

export function daysBetween(fromDay: string, toDay: string): number {
  return Math.round(
    (Date.parse(`${toDay}T00:00:00Z`) - Date.parse(`${fromDay}T00:00:00Z`)) / DAY_MS,
  );
}

export function syncLabelOf(
  status: DataSourceStatus,
  lastSyncedAt: Date | null,
  today: string,
): string {
  if (!lastSyncedAt) return "—";
  const day = isoDay(lastSyncedAt);
  if (status === "MANUAL") return `enviado em ${formatDate(`${day}T00:00:00`)}`;
  const days = daysBetween(day, today);
  if (days <= 0) return `hoje às ${isoTime(lastSyncedAt)}`;
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}
