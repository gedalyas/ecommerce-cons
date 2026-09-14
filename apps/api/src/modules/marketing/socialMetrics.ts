import type { SocialPlatform } from "@ecommerce/database/enums";
import type {
  MarketingSocial,
  SocialAccountRow,
  SocialPostRow,
} from "@ecommerce/contracts/marketing";
import type { Series, SeriesPoint } from "@ecommerce/contracts/shared/metric.types";
import { metricValue } from "@ecommerce/contracts/shared/metricValue";

export type SocialDailyFact = {
  platform: SocialPlatform;
  accountId: string;
  date: string;
  followers: number;
  reach: number;
  engagement: number;
  posts: number;
};

export type SocialTotals = {
  followers: number;
  reach: number;
  engagement: number;
  posts: number;
};

export type SocialPostFact = Omit<SocialPostRow, "engagement">;

const TOP_POSTS = 10;

const ratio = (a: number, b: number) => (b > 0 ? a / b : null);

const latestFollowersOf = (facts: SocialDailyFact[]): number => {
  const latest = new Map<string, SocialDailyFact>();
  for (const f of facts) {
    const key = `${f.platform}:${f.accountId}`;
    const current = latest.get(key);
    if (!current || f.date > current.date) latest.set(key, f);
  }
  let total = 0;
  for (const f of latest.values()) total += f.followers;
  return total;
};

export function socialTotalsOf(facts: SocialDailyFact[]): SocialTotals {
  return facts.reduce(
    (t, f) => ({
      followers: t.followers,
      reach: t.reach + f.reach,
      engagement: t.engagement + f.engagement,
      posts: t.posts + f.posts,
    }),
    { followers: latestFollowersOf(facts), reach: 0, engagement: 0, posts: 0 },
  );
}

export function socialAccountRows(facts: SocialDailyFact[]): SocialAccountRow[] {
  const groups = new Map<string, SocialDailyFact[]>();
  for (const f of facts) {
    const key = `${f.platform}:${f.accountId}`;
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }
  return [...groups.values()]
    .map((group) => {
      const totals = socialTotalsOf(group);
      const first = group[0] as SocialDailyFact;
      return {
        platform: first.platform,
        accountId: first.accountId,
        ...totals,
        engagementRate: ratio(totals.engagement, totals.reach),
      };
    })
    .sort((a, b) => b.followers - a.followers);
}

export function reachSeriesOf(
  buckets: string[],
  bucketOf: (date: string) => string,
  facts: SocialDailyFact[],
): SeriesPoint[] {
  const points = new Map<string, number>();
  for (const f of facts) {
    const bucket = bucketOf(f.date);
    points.set(bucket, (points.get(bucket) ?? 0) + f.reach);
  }
  return buckets.map((bucket) => ({ bucket, value: points.get(bucket) ?? 0 }));
}

export const postEngagementOf = (post: SocialPostFact) =>
  post.likes + post.comments + post.saves + post.shares;

export function topPostsOf(posts: SocialPostFact[]): SocialPostRow[] {
  return posts
    .map((post) => ({ ...post, engagement: postEngagementOf(post) }))
    .sort((a, b) => b.engagement - a.engagement || b.reach - a.reach)
    .slice(0, TOP_POSTS);
}

export function marketingSocialOf(
  current: SocialDailyFact[],
  previous: SocialDailyFact[] | null,
  posts: SocialPostFact[],
  reachSeries: Series,
): MarketingSocial {
  const now = socialTotalsOf(current);
  const before = previous ? socialTotalsOf(previous) : null;
  const rate = ratio(now.engagement, now.reach);
  const previousRate = before ? ratio(before.engagement, before.reach) : null;
  return {
    followers: metricValue("count", now.followers, before?.followers ?? null),
    reach: metricValue("count", now.reach, before?.reach ?? null),
    engagement: metricValue("count", now.engagement, before?.engagement ?? null),
    posts: metricValue("count", now.posts, before?.posts ?? null),
    engagementRate: metricValue(
      "percent",
      rate === null ? null : rate * 100,
      previousRate === null ? null : previousRate * 100,
    ),
    reachSeries,
    accounts: socialAccountRows(current),
    topPosts: topPostsOf(posts),
  };
}
