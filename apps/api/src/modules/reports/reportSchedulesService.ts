import {
  MAX_SCHEDULES_PER_USER,
  reportSectionKeys,
  sectionsCovered,
  type ReportRecipient,
  type ReportSchedule,
  type ReportScheduleInput,
  type ReportSchedulesScreen,
} from "@ecommerce/contracts/reports";
import { prismaClient } from "@ecommerce/database/client";
import type { ReportFrequency } from "@ecommerce/database/enums";
import { recordActivity } from "@/modules/audit/contract";
import { authContextFor } from "@/modules/auth/contract";
import type { AuthContext } from "@/shared/http/auth.types";
import { HttpError, notFound } from "@/shared/http/httpError";
import { assertSectionsVisible } from "./reportsService";

type ScheduleRow = {
  id: string;
  name: string;
  sections: string[];
  frequency: ReportFrequency;
  weekday: number | null;
  monthDay: number | null;
  hour: number;
  recipients: string[];
  enabled: boolean;
  lastSentAt: Date | null;
};

const toSchedule = (row: ScheduleRow, known?: ReadonlySet<string>): ReportSchedule => ({
  id: row.id,
  name: row.name,
  sections: reportSectionKeys.filter((key) => row.sections.includes(key)),
  frequency: row.frequency,
  weekday: row.weekday,
  monthDay: row.monthDay,
  hour: row.hour,
  recipientIds: known ? row.recipients.filter((id) => known.has(id)) : row.recipients,
  enabled: row.enabled,
  lastSentAt: row.lastSentAt?.toISOString() ?? null,
});

const recipientSelect = { id: true, name: true, email: true } as const;

async function recipientsFor(auth: AuthContext): Promise<ReportRecipient[]> {
  const me = await prismaClient.user.findUniqueOrThrow({
    where: { id: auth.userId },
    select: recipientSelect,
  });
  if (auth.role === "CLIENT") return [me];
  const store = await prismaClient.user.findMany({
    where: { clientId: auth.clientId, role: "CLIENT", id: { not: me.id } },
    select: recipientSelect,
    orderBy: { name: "asc" },
  });
  return [me, ...store];
}

async function assertRecipientsSee(auth: AuthContext, input: ReportScheduleInput) {
  const others = await prismaClient.user.findMany({
    where: { id: { in: input.recipientIds.filter((id) => id !== auth.userId) } },
    select: { id: true, name: true, role: true },
  });
  for (const person of others) {
    const access = await authContextFor({ userId: person.id, role: person.role }, auth.clientId);
    if (!access || !sectionsCovered(input.sections, access.access, access.release)) {
      throw new HttpError(422, `${person.name} não tem acesso a todas as seções escolhidas.`);
    }
  }
}

async function checkedData(auth: AuthContext, input: ReportScheduleInput) {
  assertSectionsVisible(auth, input.sections);
  const allowed = new Set((await recipientsFor(auth)).map((r) => r.id));
  if (input.recipientIds.some((id) => !allowed.has(id))) {
    throw new HttpError(422, "Escolha destinatários entre as pessoas desta loja.");
  }
  await assertRecipientsSee(auth, input);
  return {
    name: input.name,
    sections: input.sections,
    frequency: input.frequency,
    weekday: input.frequency === "WEEKLY" ? input.weekday : null,
    monthDay: input.frequency === "MONTHLY" ? input.monthDay : null,
    hour: input.hour,
    recipients: [...new Set(input.recipientIds)],
    enabled: input.enabled,
  };
}

async function ownSchedule(auth: AuthContext, id: string): Promise<ScheduleRow> {
  const row = await prismaClient.reportSchedule.findFirst({
    where: { id, clientId: auth.clientId, userId: auth.userId },
  });
  if (!row) throw notFound("Automação não encontrada.");
  return row;
}

export async function reportSchedulesScreen(auth: AuthContext): Promise<ReportSchedulesScreen> {
  const rows = await prismaClient.reportSchedule.findMany({
    where: { clientId: auth.clientId, userId: auth.userId },
    orderBy: { createdAt: "asc" },
  });
  const recipients = await recipientsFor(auth);
  const known = new Set(recipients.map((r) => r.id));
  return { schedules: rows.map((row) => toSchedule(row, known)), recipients };
}

export async function createReportSchedule(
  auth: AuthContext,
  input: ReportScheduleInput,
): Promise<ReportSchedule> {
  const owned = await prismaClient.reportSchedule.count({
    where: { clientId: auth.clientId, userId: auth.userId },
  });
  if (owned >= MAX_SCHEDULES_PER_USER) {
    throw new HttpError(422, `Você já tem ${MAX_SCHEDULES_PER_USER} automações nesta loja.`);
  }
  const data = await checkedData(auth, input);
  const row = await prismaClient.reportSchedule.create({
    data: { ...data, clientId: auth.clientId, userId: auth.userId },
  });
  await recordActivity(auth, auth.clientId, { action: "REPORT_SCHEDULE_CREATED", name: row.name });
  return toSchedule(row);
}

export async function updateReportSchedule(
  auth: AuthContext,
  id: string,
  input: ReportScheduleInput,
): Promise<ReportSchedule> {
  await ownSchedule(auth, id);
  const row = await prismaClient.reportSchedule.update({
    where: { id },
    data: await checkedData(auth, input),
  });
  await recordActivity(auth, auth.clientId, { action: "REPORT_SCHEDULE_UPDATED", name: row.name });
  return toSchedule(row);
}

export async function deleteReportSchedule(auth: AuthContext, id: string): Promise<void> {
  const row = await ownSchedule(auth, id);
  await prismaClient.reportSchedule.delete({ where: { id } });
  await recordActivity(auth, auth.clientId, { action: "REPORT_SCHEDULE_DELETED", name: row.name });
}
