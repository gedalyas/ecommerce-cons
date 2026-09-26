import {
  defaultMarketingSearch,
  type MarketingCostLine,
  type MarketingScreen,
  type MarketingTab,
} from "@ecommerce/contracts/marketing";
import {
  reportSectionLabel,
  sectionsVisibleTo,
  type ReportDocument,
  type ReportRequest,
  type ReportSectionKey,
} from "@ecommerce/contracts/reports";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import { prismaClient } from "@ecommerce/database/client";
import { dashboardOverview } from "@/modules/dashboard/contract";
import { marketingScreen } from "@/modules/marketing/contract";
import type { AuthContext } from "@/shared/http/auth.types";
import { forbidden } from "@/shared/http/httpError";
import { reportDocumentOf } from "./reportDocument";
import type { ReportFacts } from "./reportSections";

export type ReportDependencies = {
  costLinesFor: (clientId: string, search: PeriodSearch) => Promise<MarketingCostLine[]>;
  now: () => Date;
};

const dashboardSections: readonly ReportSectionKey[] = [
  "kpis",
  "salesVsInvestment",
  "roasByChannel",
  "channelSplit",
  "topProducts",
  "funnel",
];

export function assertSectionsVisible(
  auth: AuthContext,
  sections: readonly ReportSectionKey[],
): void {
  const visible = sectionsVisibleTo(auth.access, auth.release);
  const denied = sections.filter((key) => !visible.includes(key));
  if (denied.length > 0) {
    const names = denied.map((key) => reportSectionLabel[key]).join(", ");
    throw forbidden(`Você não tem acesso a: ${names}.`);
  }
}

async function reportFacts(
  auth: AuthContext,
  sections: readonly ReportSectionKey[],
  period: PeriodSearch,
  deps: ReportDependencies,
): Promise<ReportFacts> {
  const wants = (key: ReportSectionKey) => sections.includes(key);
  const custos = await deps.costLinesFor(auth.clientId, period);
  const tab = (aba: MarketingTab): Promise<MarketingScreen> =>
    marketingScreen(auth.clientId, {
      ...defaultMarketingSearch,
      ...period,
      aba,
      custos,
      canEdit: false,
    });
  const [overview, meta, google, funnel, channels] = await Promise.all([
    dashboardSections.some(wants) ? dashboardOverview(auth, period) : null,
    wants("meta") ? tab("meta") : null,
    wants("google") ? tab("google") : null,
    wants("investmentFunnel") ? tab("funil") : null,
    wants("salesChannels") ? tab("canais") : null,
  ]);
  return {
    overview,
    meta: meta && "platformTab" in meta ? meta.platformTab : null,
    google: google && "platformTab" in google ? google.platformTab : null,
    funnel: funnel && "funnel" in funnel ? funnel.funnel.summary : null,
    salesChannels: channels && "salesChannels" in channels ? channels.salesChannels : null,
  };
}

export async function reportPreview(
  auth: AuthContext,
  request: ReportRequest,
  deps: ReportDependencies,
): Promise<ReportDocument> {
  assertSectionsVisible(auth, request.sections);
  const { sections, ...period } = request;
  const store = await prismaClient.client.findUniqueOrThrow({
    where: { id: auth.clientId },
    select: { name: true, timezone: true },
  });
  return reportDocumentOf({
    storeName: store.name,
    range: { inicio: period.inicio, fim: period.fim },
    generatedAt: deps.now().toISOString(),
    timezone: store.timezone,
    sections,
    facts: await reportFacts(auth, sections, period, deps),
  });
}
