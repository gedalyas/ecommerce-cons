import {
  reportSectionKeys,
  sectionsCovered,
  templateOfFrequency,
  templateRange,
  type ReportSectionKey,
} from "@ecommerce/contracts/reports";
import { prismaClient } from "@ecommerce/database/client";
import { recordActivity } from "@/modules/audit/contract";
import { authContextFor } from "@/modules/auth/contract";
import type { Jobs } from "@/shared/jobs/jobs.types";
import type { Mailer } from "@/shared/mail/mailer.types";
import { HttpError } from "@/shared/http/httpError";
import { reportMail } from "./reportMail";
import { reportFileName, safeTimeZone } from "./reportPdfDefinition";
import { createReportRenderer } from "./reportPdfService";
import { isDue, localClockOf } from "./reportScheduleClock";
import { reportPreview, type ReportDependencies } from "./reportsService";

export type ReportDeliveryDependencies = ReportDependencies & {
  jobs: Jobs;
  mailer: Mailer;
  appUrl: string;
};

type Render = ReturnType<typeof createReportRenderer>;
type SendData = { scheduleId: string };
type Recipient = { email: string };

const DISPATCH_QUEUE = "report.dispatch";
const SEND_QUEUE = "report.send";
const HOURLY = "0 * * * *";

async function dispatch(deps: ReportDeliveryDependencies): Promise<void> {
  const now = deps.now();
  const rows = await prismaClient.reportSchedule.findMany({
    where: { enabled: true, client: { archivedAt: null } },
    select: {
      id: true,
      enabled: true,
      frequency: true,
      weekday: true,
      monthDay: true,
      hour: true,
      lastSentAt: true,
      client: { select: { timezone: true } },
    },
  });
  for (const row of rows) {
    if (!isDue(row, now, safeTimeZone(row.client.timezone))) continue;
    await deps.jobs.send<SendData>(SEND_QUEUE, { scheduleId: row.id }, { retryLimit: 0 });
  }
}

async function recipientsWhoSee(
  ids: string[],
  clientId: string,
  sections: readonly ReportSectionKey[],
): Promise<Recipient[]> {
  const people = await prismaClient.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, email: true, role: true },
  });
  const allowed: Recipient[] = [];
  for (const person of people) {
    const access = await authContextFor({ userId: person.id, role: person.role }, clientId);
    if (access && sectionsCovered(sections, access.access, access.release)) {
      allowed.push({ email: person.email });
    }
  }
  return allowed;
}

async function claimSlot(id: string, lastSentAt: Date | null, now: Date): Promise<boolean> {
  const { count } = await prismaClient.reportSchedule.updateMany({
    where: { id, lastSentAt },
    data: { lastSentAt: now },
  });
  return count === 1;
}

async function prepare(scheduleId: string, deps: ReportDeliveryDependencies) {
  const now = deps.now();
  const row = await prismaClient.reportSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      user: { select: { role: true, name: true } },
      client: { select: { timezone: true } },
    },
  });
  const timeZone = safeTimeZone(row?.client.timezone ?? "");
  if (!row || !isDue(row, now, timeZone)) return null;
  const auth = await authContextFor({ userId: row.userId, role: row.user.role }, row.clientId);
  if (!auth) return null;
  const sections = reportSectionKeys.filter((key) => row.sections.includes(key));
  const recipients = await recipientsWhoSee(row.recipients, row.clientId, sections);
  if (recipients.length === 0 || !(await claimSlot(row.id, row.lastSentAt, now))) return null;
  const range = templateRange(templateOfFrequency[row.frequency], localClockOf(now, timeZone).day);
  const request = {
    ...range,
    sections,
    por: "dia",
    comparar: "periodo-anterior",
    canal: "todos",
  } as const;
  try {
    return { row, recipients, document: await reportPreview(auth, request, deps) };
  } catch (error) {
    if (error instanceof HttpError && error.status === 403) return null;
    throw error;
  }
}

async function deliver(scheduleId: string, render: Render, deps: ReportDeliveryDependencies) {
  const prepared = await prepare(scheduleId, deps);
  if (!prepared) return;
  const { row, recipients, document } = prepared;
  const pdf = await render(document);
  const fileName = reportFileName(document.storeName, document.range);
  let sent = 0;
  for (const { email } of recipients) {
    const mail = reportMail({
      to: email,
      scheduleName: row.name,
      document,
      pdf,
      fileName,
      appUrl: deps.appUrl,
      createdBy: row.user.name,
    });
    try {
      await deps.mailer.send(mail);
      sent += 1;
    } catch (error) {
      console.error("report mail failed", row.id, error instanceof Error ? error.message : error);
    }
  }
  await recordActivity({ system: "Relatório automático" }, row.clientId, {
    action: "REPORT_SENT",
    name: row.name,
    recipients: sent,
  });
}

export async function registerReportJobs(deps: ReportDeliveryDependencies): Promise<void> {
  const render = createReportRenderer(1);
  await deps.jobs.work<SendData>(SEND_QUEUE, (data) => deliver(data.scheduleId, render, deps));
  await deps.jobs.work<object>(DISPATCH_QUEUE, () => dispatch(deps));
  await deps.jobs.schedule(DISPATCH_QUEUE, HOURLY, {});
}
