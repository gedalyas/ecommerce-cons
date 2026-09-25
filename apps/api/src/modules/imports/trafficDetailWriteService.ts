import { prismaClient } from "@ecommerce/database/client";
import type { KeywordRow, TrafficDetail } from "./importRows.types";
import { daysOf, mergeKeywords, mergeTrafficDetail } from "./trafficDetailRules";

const dayOf = (day: string) => new Date(`${day}T00:00:00.000Z`);
const daysIn = (rows: readonly { date: string }[]) => ({ in: daysOf(rows).map(dayOf) });
const dated = <T extends { date: string }>(clientId: string, rows: readonly T[]) =>
  rows.map(({ date, ...rest }) => ({ clientId, date: dayOf(date), ...rest }));

export async function writeSyncedKeywords(clientId: string, rows: KeywordRow[]): Promise<number> {
  const merged = mergeKeywords(rows);
  if (merged.length === 0) return 0;
  const accounts = new Map(merged.map((r) => [`${r.platform}|${r.accountId}`, r]));
  await prismaClient.$transaction(async (tx) => {
    for (const { platform, accountId } of accounts.values()) {
      const own = merged.filter((r) => r.platform === platform && r.accountId === accountId);
      await tx.adKeywordDaily.deleteMany({
        where: { clientId, platform, accountId, date: daysIn(own) },
      });
    }
    await tx.adKeywordDaily.createMany({ data: dated(clientId, merged) });
  });
  return merged.length;
}

export async function writeSyncedTrafficDetail(
  clientId: string,
  detail: TrafficDetail,
): Promise<number> {
  const { pages, items, audience, regions } = mergeTrafficDetail(detail);
  await prismaClient.$transaction(async (tx) => {
    if (pages.length > 0) {
      await tx.trafficPageDaily.deleteMany({ where: { clientId, date: daysIn(pages) } });
      await tx.trafficPageDaily.createMany({ data: dated(clientId, pages) });
    }
    if (items.length > 0) {
      await tx.trafficItemDaily.deleteMany({ where: { clientId, date: daysIn(items) } });
      await tx.trafficItemDaily.createMany({ data: dated(clientId, items) });
    }
    if (audience.length > 0) {
      await tx.trafficAudienceDaily.deleteMany({ where: { clientId, date: daysIn(audience) } });
      await tx.trafficAudienceDaily.createMany({ data: dated(clientId, audience) });
    }
    if (regions.length > 0) {
      await tx.trafficRegionDaily.deleteMany({ where: { clientId, date: daysIn(regions) } });
      await tx.trafficRegionDaily.createMany({ data: dated(clientId, regions) });
    }
  });
  return pages.length + items.length + audience.length + regions.length;
}
