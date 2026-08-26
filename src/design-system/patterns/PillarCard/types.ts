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
  /** Identificador de conteúdo extra, resolvido pela feature dona da tela. */
  extra?: string;
};

export type PillarCardProps = {
  pillar: Pillar;
  /** Conteúdo específico da feature, exibido entre os KPIs e as recomendações. */
  extraSlot?: ReactNode;
};
