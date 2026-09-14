import { describe, expect, it } from "vitest";
import {
  dailyValuesOf,
  daysBetween,
  facebookDailyOf,
  facebookPostOf,
  insightTotalOf,
  instagramDailyOf,
  instagramPostOf,
  type GraphInsight,
} from "./instagramRows";

const insights: GraphInsight[] = [
  {
    name: "reach",
    period: "day",
    values: [
      { value: 100, end_time: "2026-09-02T07:00:00+0000" },
      { value: 150, end_time: "2026-09-03T07:00:00+0000" },
    ],
  },
  {
    name: "follower_count",
    period: "day",
    values: [
      { value: 5, end_time: "2026-09-02T07:00:00+0000" },
      { value: 3, end_time: "2026-09-03T07:00:00+0000" },
    ],
  },
];

describe("insight helpers", () => {
  it("sums totals, including breakdown objects, and indexes daily values by day", () => {
    expect(insightTotalOf(insights, "reach")).toBe(250);
    expect(
      insightTotalOf([{ name: "shares", values: [{ value: { feed: 2, story: 1 } }] }], "shares"),
    ).toBe(3);
    expect(insightTotalOf(insights, "missing")).toBe(0);
    expect([...dailyValuesOf(insights, "reach")]).toEqual([
      ["2026-09-02", 100],
      ["2026-09-03", 150],
    ]);
  });

  it("lists the days of a range inclusively", () => {
    expect(daysBetween("2026-08-30", "2026-09-02")).toEqual([
      "2026-08-30",
      "2026-08-31",
      "2026-09-01",
      "2026-09-02",
    ]);
  });
});

describe("posts", () => {
  it("maps an Instagram media with its insights and a trimmed caption", () => {
    const post = instagramPostOf("ig1", {
      id: "m1",
      caption: "  Lançamento\n\nde   setembro ",
      media_type: "VIDEO",
      media_product_type: "REELS",
      timestamp: "2026-09-02T12:00:00+0000",
      permalink: "https://www.instagram.com/reel/abc/",
      like_count: 40,
      comments_count: 4,
      insights: {
        data: [
          { name: "reach", values: [{ value: 900 }] },
          { name: "saved", values: [{ value: 12 }] },
          { name: "shares", values: [{ value: 6 }] },
        ],
      },
    });
    expect(post).toMatchObject({
      platform: "INSTAGRAM",
      externalId: "m1",
      mediaType: "REELS",
      caption: "Lançamento de setembro",
      likes: 40,
      comments: 4,
      saves: 12,
      shares: 6,
      reach: 900,
    });
    expect(instagramPostOf("ig1", { id: "m2" })).toBeNull();
  });

  it("maps a Facebook post from the summaries", () => {
    expect(
      facebookPostOf("pg1", {
        id: "p1",
        message: "Promoção",
        created_time: "2026-09-01T10:00:00+0000",
        permalink_url: "https://facebook.com/p1",
        shares: { count: 2 },
        likes: { summary: { total_count: 30 } },
        comments: { summary: { total_count: 5 } },
        insights: { data: [{ name: "post_impressions_unique", values: [{ value: 500 }] }] },
      }),
    ).toMatchObject({ platform: "FACEBOOK", likes: 30, comments: 5, shares: 2, reach: 500 });
  });
});

describe("daily rows", () => {
  const days = ["2026-09-01", "2026-09-02", "2026-09-03"];

  it("walks followers back from today using the daily gains and counts posts per day", () => {
    const posts = [
      {
        platform: "INSTAGRAM" as const,
        accountId: "ig1",
        externalId: "m1",
        mediaType: "IMAGE",
        publishedAt: "2026-09-02T12:00:00+0000",
        permalink: "",
        caption: "",
        likes: 10,
        comments: 2,
        saves: 1,
        shares: 0,
        reach: 100,
      },
    ];
    const rows = instagramDailyOf("ig1", insights, 1000, posts, days);
    expect(rows.map((r) => [r.date, r.followers, r.reach, r.engagement, r.posts])).toEqual([
      ["2026-09-01", 992, 0, 0, 0],
      ["2026-09-02", 997, 100, 13, 1],
      ["2026-09-03", 1000, 150, 0, 0],
    ]);
  });

  it("carries the last known fan count forward for the page", () => {
    const rows = facebookDailyOf(
      "pg1",
      [
        { name: "page_fans", values: [{ value: 300, end_time: "2026-09-01T07:00:00+0000" }] },
        {
          name: "page_impressions_unique",
          values: [{ value: 40, end_time: "2026-09-02T07:00:00+0000" }],
        },
        {
          name: "page_post_engagements",
          values: [{ value: 7, end_time: "2026-09-02T07:00:00+0000" }],
        },
      ],
      [],
      days,
    );
    expect(rows.map((r) => [r.date, r.followers, r.reach, r.engagement])).toEqual([
      ["2026-09-01", 300, 0, 0],
      ["2026-09-02", 300, 40, 7],
      ["2026-09-03", 300, 0, 0],
    ]);
  });
});
