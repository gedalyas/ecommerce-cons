import type { BreakdownSlice, MetricValue, Series } from "@/shared/models/types/metric.types";

export type OrdersOverview = {
  metrics: {
    totalSold: MetricValue;
    orders: MetricValue;
    averageTicket: MetricValue;
    approvalRate: MetricValue;
  };
  series: {
    totalSold: Series;
    orders: Series;
    averageTicket: Series;
  };
  byStatus: BreakdownSlice[];
};
