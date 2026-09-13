import type { Metric } from "@/shared/ui/metricTile.types";
import type { Recommendation } from "@/shared/ui/recommendationList.types";
import type { Section } from "@/shared/ui/sectionPage.types";

export const sectionKeys = ["money", "marketing", "logistics", "management"] as const;
export type SectionKey = (typeof sectionKeys)[number];

export type MilestoneCriterion = {
  key: string;
  name: string;
  progress: number;
  achieved: boolean;
  note: string;
};

export type MilestoneSummary = { achieved: number; total: number };

export type ConsultingSection = Section;
export type ConsultingMetric = Metric;
export type ConsultingRecommendation = Recommendation;
