import type {
  DataSourceStatus,
  Fidelity,
  InfluencerRuleType,
  InfluencerStatus,
} from "../../src/generated/prisma/enums";

export type PillarStatusKey = "done" | "in-progress" | "not-started" | "blocked";

export type MetricSeed = {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "neutral";
  subNote?: string;
  fidelity: Fidelity;
  fidelityNote: string;
};

export type RecommendationSeed = { text: string; dueDate: string; owner: string };

export type PillarSeed = {
  title: string;
  status: PillarStatusKey;
  kpis: MetricSeed[];
  recommendations: RecommendationSeed[];
  dataPending?: string;
  extra?: string;
};

export type SectionSeed = { title: string; subtitle: string; pillars: PillarSeed[] };

export type ConnectionSeed = {
  name: string;
  kind: string;
  status: DataSourceStatus;
  lastSyncedAt: string | null;
};

export type GoalMonthSeed = {
  month: number;
  totalSold: number;
  averageTicket: number;
  conversionRate: number;
  paidTraffic: number;
  otherMarketing: number;
  repurchaseRate: number;
};

export type InfluencerSeed = {
  name: string;
  handle: string;
  status: InfluencerStatus;
  notes: string;
  rules: {
    type: InfluencerRuleType;
    value: number;
    startDate: string;
    endDate: string | null;
    cap: number | null;
    notes: string;
  }[];
  coupons: { code: string; activeFrom: string | null; activeUntil: string | null }[];
};
