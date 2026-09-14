import { prismaClient } from "@ecommerce/database/client";
import type { MarketingSocial } from "@ecommerce/contracts/marketing";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import {
  bucketOf,
  bucketWindows,
  isoDay,
  resolvePeriod,
  type Window,
} from "@ecommerce/contracts/shared/periodWindow";
import {
  marketingSocialOf,
  reachSeriesOf,
  type SocialDailyFact,
  type SocialPostFact,
} from "./socialMetrics";

async function socialDaily(clientId: string, w: Window): Promise<SocialDailyFact[]> {
  const rows = await prismaClient.socialDaily.findMany({
    where: { clientId, date: { gte: w.start, lt: w.end } },
    select: {
      platform: true,
      accountId: true,
      date: true,
      followers: true,
      reach: true,
      engagement: true,
      posts: true,
    },
  });
  return rows.map((r) => ({ ...r, date: isoDay(r.date) }));
}

async function socialPosts(clientId: string, w: Window): Promise<SocialPostFact[]> {
  const rows = await prismaClient.socialPost.findMany({
    where: { clientId, publishedAt: { gte: w.start, lt: w.end } },
    select: {
      platform: true,
      externalId: true,
      mediaType: true,
      publishedAt: true,
      permalink: true,
      caption: true,
      likes: true,
      comments: true,
      saves: true,
      shares: true,
      reach: true,
    },
  });
  return rows.map((r) => ({ ...r, publishedAt: r.publishedAt.toISOString() }));
}

export async function marketingSocial(
  clientId: string,
  input: PeriodSearch,
): Promise<MarketingSocial> {
  const period = resolvePeriod(input);
  const [current, previous, posts] = await Promise.all([
    socialDaily(clientId, period.current),
    period.previous ? socialDaily(clientId, period.previous) : Promise.resolve(null),
    socialPosts(clientId, period.current),
  ]);
  const seriesOf = (w: Window, facts: SocialDailyFact[]) =>
    reachSeriesOf(
      bucketWindows(w, period.por).map((b) => b.bucket),
      (date) => bucketOf(date, period.por),
      facts,
    );
  return marketingSocialOf(current, previous, posts, {
    current: seriesOf(period.current, current),
    previous: previous && period.previous ? seriesOf(period.previous, previous) : null,
  });
}
