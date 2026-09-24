import type { CampaignTagRow } from "./marketing.types";

export type UntaggedSummary = { count: number; spendShare: number | null };

export function untaggedSummary(tags: readonly CampaignTagRow[]): UntaggedSummary {
  const total = tags.reduce((s, t) => s + t.spend, 0);
  const untagged = tags.filter((t) => t.stage == null);
  const spend = untagged.reduce((s, t) => s + t.spend, 0);
  return { count: untagged.length, spendShare: total > 0 ? (spend / total) * 100 : null };
}
