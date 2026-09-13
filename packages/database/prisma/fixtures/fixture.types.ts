import type { InfluencerRuleType, InfluencerStatus } from "../../src/generated/prisma/enums";

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
