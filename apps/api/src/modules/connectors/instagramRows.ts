import type { SocialDailyRow, SocialPostInput } from "@/modules/imports/contract";

export type GraphInsight = {
  name?: string | null;
  period?: string | null;
  values?: { value?: number | Record<string, number> | null; end_time?: string | null }[] | null;
};

export type InstagramMedia = {
  id: string;
  caption?: string | null;
  media_type?: string | null;
  media_product_type?: string | null;
  timestamp?: string | null;
  permalink?: string | null;
  like_count?: number | null;
  comments_count?: number | null;
  insights?: { data?: GraphInsight[] | null } | null;
};

export type FacebookPost = {
  id: string;
  message?: string | null;
  created_time?: string | null;
  permalink_url?: string | null;
  shares?: { count?: number | null } | null;
  likes?: { summary?: { total_count?: number | null } | null } | null;
  comments?: { summary?: { total_count?: number | null } | null } | null;
  insights?: { data?: GraphInsight[] | null } | null;
};

export const INSTAGRAM_ACCOUNT_METRICS = "reach,follower_count";
export const INSTAGRAM_MEDIA_FIELDS =
  "id,caption,media_type,media_product_type,timestamp,permalink,like_count,comments_count,insights.metric(reach,saved,shares)";
export const FACEBOOK_PAGE_METRICS = "page_impressions_unique,page_post_engagements,page_fans";
export const FACEBOOK_POST_FIELDS =
  "id,message,created_time,permalink_url,shares,likes.summary(true),comments.summary(true),insights.metric(post_impressions_unique)";

const CAPTION_MAX = 200;

const dayOf = (iso: string | null | undefined) => (iso ?? "").slice(0, 10);

const numberOf = (value: number | Record<string, number> | null | undefined): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value && typeof value === "object") {
    return Object.values(value).reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0);
  }
  return 0;
};

export function insightTotalOf(insights: GraphInsight[] | null | undefined, name: string): number {
  const found = (insights ?? []).find((i) => i.name === name);
  return (found?.values ?? []).reduce((s, v) => s + numberOf(v.value), 0);
}

export function dailyValuesOf(
  insights: GraphInsight[] | null | undefined,
  name: string,
): Map<string, number> {
  const out = new Map<string, number>();
  const found = (insights ?? []).find((i) => i.name === name);
  for (const v of found?.values ?? []) {
    const day = dayOf(v.end_time);
    if (day) out.set(day, numberOf(v.value));
  }
  return out;
}

const captionOf = (text: string | null | undefined) =>
  (text ?? "").replace(/\s+/g, " ").trim().slice(0, CAPTION_MAX);

export function instagramPostOf(accountId: string, media: InstagramMedia): SocialPostInput | null {
  if (!media.timestamp) return null;
  const insights = media.insights?.data;
  return {
    platform: "INSTAGRAM",
    accountId,
    externalId: media.id,
    mediaType: media.media_product_type ?? media.media_type ?? "POST",
    publishedAt: media.timestamp,
    permalink: media.permalink ?? "",
    caption: captionOf(media.caption),
    likes: media.like_count ?? 0,
    comments: media.comments_count ?? 0,
    saves: insightTotalOf(insights, "saved"),
    shares: insightTotalOf(insights, "shares"),
    reach: insightTotalOf(insights, "reach"),
  };
}

export function facebookPostOf(accountId: string, post: FacebookPost): SocialPostInput | null {
  if (!post.created_time) return null;
  return {
    platform: "FACEBOOK",
    accountId,
    externalId: post.id,
    mediaType: "POST",
    publishedAt: post.created_time,
    permalink: post.permalink_url ?? "",
    caption: captionOf(post.message),
    likes: post.likes?.summary?.total_count ?? 0,
    comments: post.comments?.summary?.total_count ?? 0,
    saves: 0,
    shares: post.shares?.count ?? 0,
    reach: insightTotalOf(post.insights?.data, "post_impressions_unique"),
  };
}

const postEngagement = (p: SocialPostInput) => p.likes + p.comments + p.saves + p.shares;

function postsByDay(posts: SocialPostInput[]): Map<string, { count: number; engagement: number }> {
  const out = new Map<string, { count: number; engagement: number }>();
  for (const p of posts) {
    const day = dayOf(p.publishedAt);
    const current = out.get(day) ?? { count: 0, engagement: 0 };
    out.set(day, { count: current.count + 1, engagement: current.engagement + postEngagement(p) });
  }
  return out;
}

export function instagramDailyOf(
  accountId: string,
  insights: GraphInsight[] | null | undefined,
  followersNow: number,
  posts: SocialPostInput[],
  days: string[],
): SocialDailyRow[] {
  const reach = dailyValuesOf(insights, "reach");
  const gained = dailyValuesOf(insights, "follower_count");
  const byDay = postsByDay(posts);
  const rows: SocialDailyRow[] = [];
  let followers = followersNow;
  for (const day of [...days].sort().reverse()) {
    const dayPosts = byDay.get(day) ?? { count: 0, engagement: 0 };
    rows.push({
      platform: "INSTAGRAM",
      accountId,
      date: day,
      followers,
      reach: reach.get(day) ?? 0,
      engagement: dayPosts.engagement,
      posts: dayPosts.count,
    });
    followers = Math.max(0, followers - (gained.get(day) ?? 0));
  }
  return rows.reverse();
}

export function facebookDailyOf(
  accountId: string,
  insights: GraphInsight[] | null | undefined,
  posts: SocialPostInput[],
  days: string[],
): SocialDailyRow[] {
  const reach = dailyValuesOf(insights, "page_impressions_unique");
  const engagement = dailyValuesOf(insights, "page_post_engagements");
  const fans = dailyValuesOf(insights, "page_fans");
  const byDay = postsByDay(posts);
  let lastFans = 0;
  return [...days].sort().map((day) => {
    lastFans = fans.get(day) ?? lastFans;
    return {
      platform: "FACEBOOK",
      accountId,
      date: day,
      followers: lastFans,
      reach: reach.get(day) ?? 0,
      engagement: engagement.get(day) ?? 0,
      posts: byDay.get(day)?.count ?? 0,
    };
  });
}

export function daysBetween(from: string, to: string): string[] {
  const days: string[] = [];
  for (let d = new Date(`${from}T00:00:00.000Z`); d.toISOString().slice(0, 10) <= to;) {
    days.push(d.toISOString().slice(0, 10));
    d = new Date(d.getTime() + 24 * 60 * 60 * 1000);
  }
  return days;
}
