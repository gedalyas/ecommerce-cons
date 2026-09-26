import { canViewArea, isScreenReleased } from "../auth/contract";
import type { AccessArea, AreaAccess, ScreenRelease, StoreScreen } from "../auth/contract";
import { fromIsoDate, periodPresets, type DateRange } from "../shared/period";
import { reportSectionKeys, type ReportSectionKey, type ReportTemplate } from "./reports.types";

type SectionNeed = { area: AccessArea | null; screen: StoreScreen | null };

const marketingNeed: SectionNeed = { area: "MARKETING", screen: "MARKETING" };
const dashboardNeed: SectionNeed = { area: null, screen: null };

const reportSectionNeeds: Record<ReportSectionKey, SectionNeed> = {
  kpis: dashboardNeed,
  salesVsInvestment: dashboardNeed,
  roasByChannel: dashboardNeed,
  channelSplit: dashboardNeed,
  topProducts: dashboardNeed,
  funnel: dashboardNeed,
  meta: marketingNeed,
  google: marketingNeed,
  investmentFunnel: marketingNeed,
  salesChannels: marketingNeed,
};

export const reportTemplateSections: Record<ReportTemplate, readonly ReportSectionKey[]> = {
  weekly: ["kpis", "salesVsInvestment", "roasByChannel", "meta", "google", "investmentFunnel"],
  monthly: [
    "kpis",
    "salesVsInvestment",
    "roasByChannel",
    "channelSplit",
    "topProducts",
    "salesChannels",
    "meta",
    "google",
  ],
};

const templatePreset: Record<ReportTemplate, string> = {
  weekly: "semana-passada",
  monthly: "mes-passado",
};

export function sectionsVisibleTo(access: AreaAccess, release: ScreenRelease): ReportSectionKey[] {
  return reportSectionKeys.filter((key) => {
    const { area, screen } = reportSectionNeeds[key];
    return (!area || canViewArea(access, area)) && (!screen || isScreenReleased(release, screen));
  });
}

export function sectionsCovered(
  sections: readonly ReportSectionKey[],
  access: AreaAccess,
  release: ScreenRelease,
): boolean {
  const visible = sectionsVisibleTo(access, release);
  return sections.every((key) => visible.includes(key));
}

export function templateRange(template: ReportTemplate, today: string): DateRange {
  const preset = periodPresets.find((p) => p.key === templatePreset[template]);
  if (!preset) throw new Error(`Missing period preset for ${template}`);
  return preset.range(fromIsoDate(today));
}
