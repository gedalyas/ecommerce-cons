import type { ReactNode } from "react";
import type { Metric } from "./metricTile.types";
import type { Recommendation } from "./recommendationList.types";
import type { PillarStatus } from "./statusBadge.types";

export type Pillar = {
  key?: string;
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
  /** Right-aligned control in the header, e.g. an edit button the feature owns. */
  actionSlot?: ReactNode;
};
