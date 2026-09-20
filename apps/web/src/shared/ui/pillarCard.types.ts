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
};

export type PillarCardProps = {
  pillar: Pillar;
  /** Right-aligned control in the header, e.g. an edit button the feature owns. */
  actionSlot?: ReactNode;
};
