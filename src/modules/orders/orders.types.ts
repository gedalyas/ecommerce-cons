import type {
  BreakdownSlice,
  MetricUnit,
  MetricValue,
  Series,
} from "@/shared/models/types/metric.types";
import type { OrdersFilterKey, OrdersSortField, OrdersTab } from "./ordersSchema";

/** Paid-order totals over a window (or one bucket of it), already split by sales platform. */
export type OrdersAggregate = {
  /** Paid revenue (total_price of PAID orders). */
  revenue: number;
  /** Paid orders. */
  orders: number;
  /** Revenue of every order regardless of payment state. */
  captured: number;
  capturedOrders: number;
  /** Cost of goods sold for the paid orders (qty × unit cost). */
  cogs: number;
  /** Paid orders that are the customer's second or later order. */
  repeatOrders: number;
  /** Product revenue (before discounts), units, discounts and shipping of the paid orders. */
  productRevenue: number;
  items: number;
  discounts: number;
  shipping: number;
  ecommerce: { orders: number; revenue: number };
  marketplace: { orders: number; revenue: number };
};

export type OrdersBucket = OrdersAggregate & { bucket: string };

/** Row-level filters of the Pedidos screens (values as stored, labels resolved in the UI). */
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
  /** Paid ÷ captured revenue per bucket, in percent. */
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

/** What the `/pedidos` loader returns: only the active tab's data. */
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
