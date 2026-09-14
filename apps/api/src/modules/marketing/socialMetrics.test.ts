import { describe, expect, it } from "vitest";
import {
  marketingSocialOf,
  reachSeriesOf,
  socialAccountRows,
  socialTotalsOf,
  topPostsOf,
  type SocialDailyFact,
  type SocialPostFact,
} from "./socialMetrics";

const day = (
  date: string,
  values: Partial<SocialDailyFact> & { followers: number; reach: number },
): SocialDailyFact => ({
  platform: "INSTAGRAM",
  accountId: "ig1",
  date,
  engagement: 0,
  posts: 0,
  ...values,
});

const facts: SocialDailyFact[] = [
  day("2026-09-01", { followers: 1000, reach: 400, engagement: 20, posts: 1 }),
  day("2026-09-02", { followers: 1010, reach: 600, engagement: 40, posts: 0 }),
  day("2026-09-02", { platform: "FACEBOOK", accountId: "pg1", followers: 300, reach: 100 }),
];

describe("socialTotalsOf", () => {
  it("sums reach, engagement and posts but takes the latest followers per account", () => {
    expect(socialTotalsOf(facts)).toEqual({
      followers: 1310,
      reach: 1100,
      engagement: 60,
      posts: 1,
    });
  });

  it("is all zeros for an empty store", () => {
    expect(socialTotalsOf([])).toEqual({ followers: 0, reach: 0, engagement: 0, posts: 0 });
  });
});

describe("socialAccountRows", () => {
  it("groups by platform and account with the engagement rate", () => {
    const rows = socialAccountRows(facts);
    expect(rows.map((r) => [r.platform, r.followers, r.reach, r.engagementRate])).toEqual([
      ["INSTAGRAM", 1010, 1000, 0.06],
      ["FACEBOOK", 300, 100, 0],
    ]);
  });
});

describe("reachSeriesOf", () => {
  it("fills every bucket, summing the facts that fall into it", () => {
    const series = reachSeriesOf(["2026-09-01", "2026-09-02", "2026-09-03"], (d) => d, facts);
    expect(series.map((p) => p.value)).toEqual([400, 700, 0]);
  });
});

const post = (id: string, values: Partial<SocialPostFact>): SocialPostFact => ({
  platform: "INSTAGRAM",
  externalId: id,
  mediaType: "IMAGE",
  publishedAt: "2026-09-01T12:00:00.000Z",
  permalink: `https://instagram.com/p/${id}`,
  caption: "",
  likes: 0,
  comments: 0,
  saves: 0,
  shares: 0,
  reach: 0,
  ...values,
});

describe("topPostsOf and marketingSocialOf", () => {
  it("ranks posts by engagement then reach", () => {
    const top = topPostsOf([
      post("a", { likes: 10, reach: 50 }),
      post("b", { likes: 5, comments: 5, saves: 2, reach: 10 }),
      post("c", { likes: 10, reach: 80 }),
    ]);
    expect(top.map((p) => [p.externalId, p.engagement])).toEqual([
      ["b", 12],
      ["c", 10],
      ["a", 10],
    ]);
  });

  it("builds the tab with variations against the previous window", () => {
    const social = marketingSocialOf(
      facts,
      [day("2026-08-01", { followers: 900, reach: 500, engagement: 50 })],
      [],
      { current: [], previous: null },
    );
    expect(social.followers).toMatchObject({ value: 1310, previous: 900 });
    expect(social.reach).toMatchObject({ value: 1100, previous: 500 });
    expect(social.engagementRate.value).toBeCloseTo(5.4545, 3);
    expect(social.engagementRate.previous).toBe(10);
    expect(
      marketingSocialOf([], null, [], { current: [], previous: null }).engagementRate.value,
    ).toBeNull();
  });
});
