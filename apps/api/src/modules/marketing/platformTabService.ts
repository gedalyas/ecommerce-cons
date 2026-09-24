import type { AdPlatform } from "@ecommerce/database/enums";
import { currentDay } from "@/shared/config/clock";
import type { MarketingPlatformTab, MarketingSearch } from "@ecommerce/contracts/marketing";
import { platformKpis } from "@ecommerce/contracts/marketing";
import { metricValue } from "@ecommerce/contracts/shared/metricValue";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import {
  bucketWindows,
  resolvePeriod,
  truncUnit,
  type Window,
} from "@ecommerce/contracts/shared/periodWindow";
import {
  deriveDepth,
  platformKpiUnit,
  platformKpiValues,
  platformSeries,
  sumDepth,
} from "./adDepth";
import {
  adAccounts,
  depthByBucket,
  depthByLevel,
  platformSessionsByBucket,
  platformSessionsTotal,
  type DepthScope,
} from "./adsDepthService";
import { lastMonthsWindow } from "./generalMetrics";

type PlatformInput = PeriodSearch & MarketingSearch;

const isNarrowed = (scope: DepthScope) =>
  scope.account !== "todas" || scope.campaign != null || scope.adset != null;

async function seriesOf(
  clientId: string,
  w: Window,
  granularity: "mes" | PeriodSearch["por"],
  scope: DepthScope,
) {
  const unit = truncUnit[granularity];
  const [ads, sessions] = await Promise.all([
    depthByBucket(clientId, w, unit, scope),
    isNarrowed(scope) ? null : platformSessionsByBucket(clientId, w, unit, scope.platform),
  ]);
  const buckets = bucketWindows(w, granularity).map((b) => b.bucket);
  return platformSeries(buckets, ads, sessions);
}

async function windowRows(
  clientId: string,
  w: Window,
  level: PlatformInput["nivel"],
  scope: DepthScope,
) {
  const [rows, sessions] = await Promise.all([
    depthByLevel(clientId, w, level, scope),
    isNarrowed(scope) ? null : platformSessionsTotal(clientId, w, scope.platform),
  ]);
  return { rows, total: sumDepth(rows, "total", "Total"), sessions };
}

export async function platformTab(
  clientId: string,
  platform: AdPlatform,
  input: PlatformInput,
): Promise<MarketingPlatformTab> {
  const today = currentDay();
  const period = resolvePeriod(input);
  const scope: DepthScope = {
    platform,
    account: input.conta,
    campaign: input.campanha,
    adset: input.conjunto,
  };
  const [accounts, cur, prev, monthly, daily] = await Promise.all([
    adAccounts(clientId, platform, lastMonthsWindow(today, 13)),
    windowRows(clientId, period.current, input.nivel, scope),
    period.previous ? windowRows(clientId, period.previous, input.nivel, scope) : null,
    seriesOf(clientId, lastMonthsWindow(today, 12), "mes", scope),
    seriesOf(clientId, period.current, input.por, scope),
  ]);
  const fee = input.incluirTaxa;
  const total = deriveDepth(cur.total, prev?.total ?? null, fee);
  const c = platformKpiValues(total, cur.sessions);
  const p = prev ? platformKpiValues(deriveDepth(prev.total, null, fee), prev.sessions) : null;
  const previousByKey = new Map((prev?.rows ?? []).map((r) => [r.key, r]));
  return {
    platform,
    accounts,
    kpis: Object.fromEntries(
      platformKpis.map((k) => [k, metricValue(platformKpiUnit[k], c[k], p?.[k] ?? null)]),
    ) as MarketingPlatformTab["kpis"],
    monthly,
    daily,
    rows: cur.rows.map((r) => deriveDepth(r, previousByKey.get(r.key) ?? null, fee)),
    total,
  };
}
