import type { BreakdownSlice, MetricUnit, MetricValue, Series } from "../shared/metric.types";
import type { OrdersFilterKey, OrdersSortField, OrdersTab } from "./ordersSchema";

export type OrdersAggregate = {
  revenue: number;
  orders: number;
  captured: number;
  capturedOrders: number;
  cogs: number | null;
  costCoverage: number | null;
  repeatOrders: number;
  productRevenue: number;
  items: number;
  discounts: number;
  shipping: number;
  ecommerce: { orders: number; revenue: number };
  marketplace: { orders: number; revenue: number };
};

export type OrdersBucket = OrdersAggregate & { bucket: string };

export type OrdersFilters = Record<OrdersFilterKey, string[]> & { busca: string };

export type OrdersFilterOption = { value: string; label: string };
export type OrdersFilterOptions = Record<OrdersFilterKey, OrdersFilterOption[]>;

export const ordersSummaryKeys = [
  "captured",
  "revenue",
  "approvalRate",
  "orders",
  "averageTicket",
  "itemsPerOrder",
  "discounts",
  "discountPerOrder",
  "shipping",
] as const;
export type OrdersSummaryKey = (typeof ordersSummaryKeys)[number];

export type OrdersSummaryMetric = {
  key: OrdersSummaryKey;
  label: string;
  unit: MetricUnit;
  goodWhen: "up" | "down";
  metric: MetricValue;
};

export type OrdersSourceRow = {
  channel: string;
  source: string;
  captured: number;
  paid: number;
  approvalRate: number | null;
  paidOrders: number;
  averageTicket: number | null;
  items: number;
  discounts: number;
  discountPerOrder: number | null;
};

export type OrdersSummary = {
  metrics: OrdersSummaryMetric[];
  series: Record<OrdersSummaryKey, Series>;
  sourceSlices: BreakdownSlice[];
  bySource: OrdersSourceRow[];
};

export type ApprovalDimensionKey = "status" | "metodo" | "gateway";

export type ApprovalRow = {
  key: string;
  label: string;
  captured: number;
  paid: number;
  approvalRate: number | null;
  orders: number;
  paidOrders: number;
};

export type OrdersApproval = {
  approvalSeries: Series;
  dimensions: {
    key: ApprovalDimensionKey;
    label: string;
    slices: BreakdownSlice[];
    rows: ApprovalRow[];
  }[];
};

export type OrdersListRow = {
  id: string;
  number: string;
  placedAt: string;
  channel: string;
  source: string;
  status: string;
  statusLabel: string;
  customerName: string;
  email: string;
  phone: string | null;
  total: number;
  items: number;
  cost: number | null;
  grossProfit: number | null;
  margin: number | null;
};

export type OrdersListPage = {
  rows: OrdersListRow[];
  total: number;
  page: number;
  pageSize: number;
  sort: { field: OrdersSortField; direction: "asc" | "desc" };
};

export type RegionRow = {
  key: string;
  label: string;
  province: string;
  paid: number;
  paidShare: number;
  captured: number;
  approvalRate: number | null;
  paidOrders: number;
  capturedOrders: number;
  averageTicket: number | null;
  customers: number;
  items: number;
  itemsPerOrder: number | null;
  discounts: number;
  discountPerOrder: number | null;
};

export type OrdersRegions = {
  provinces: RegionRow[];
  cities: RegionRow[];
};

export type OrdersScreen =
  | { aba: Extract<OrdersTab, "resumo">; summary: OrdersSummary }
  | { aba: Extract<OrdersTab, "aprovacao">; approval: OrdersApproval; options: OrdersFilterOptions }
  | { aba: Extract<OrdersTab, "lista">; list: OrdersListPage; options: OrdersFilterOptions }
  | { aba: Extract<OrdersTab, "regioes">; regions: OrdersRegions; options: OrdersFilterOptions };
