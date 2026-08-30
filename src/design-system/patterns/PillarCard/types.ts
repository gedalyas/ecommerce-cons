import type { ReactNode } from "react";
import type { Metric } from "../MetricTile/types";
import type { Recommendation } from "../RecommendationList/types";
import type { PillarStatus } from "../StatusBadge/types";

export type Pillar = {
  title: string;
  status: PillarStatus;
  kpis: Metric[];
  recommendations: Recommendation[];
  dataPending?: string;
  /** Extra-content id, resolved by the feature that owns the screen. */
  extra?: string;
};

export type PillarCardProps = {
  pillar: Pillar;
  /** Feature-specific content, rendered between the KPIs and the recommendations. */
  extraSlot?: ReactNode;
};
