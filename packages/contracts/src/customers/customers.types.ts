import type {
  BreakdownSlice,
  MetricUnit,
  MetricValue,
  Series,
  SeriesPoint,
} from "../shared/metric.types";
import type { CustomersSortField, CustomersTab, RfmFilterListKey } from "./customersSchema";

export type CustomersAggregate = {
  /** Distinct buyers with a paid order in the window. */
  customers: number;
  /** Buyers whose first paid order falls in the window. */
  newCustomers: number;
};

export type CustomersBucket = CustomersAggregate & { bucket: string };

// ---------------------------------------------------------------------------
// RFM
// ---------------------------------------------------------------------------

export type RfmScores = { r: number; f: number; m: number };

export type RfmSegmentShare = BreakdownSlice & { customers: number; revenue: number };

export type RfmCustomerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  segment: string;
  orders: number;
  total: number;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  daysSinceLastPurchase: number | null;
  source: string | null;
  province: string | null;
  city: string | null;
};

export type RfmPage = {
  rows: RfmCustomerRow[];
  total: number;
  page: number;
  pageSize: number;
  sort: { field: CustomersSortField; direction: "asc" | "desc" };
};

export type RfmFilterOptions = Record<RfmFilterListKey, { value: string; label: string }[]> & {
  ranges: { totalMin: number; totalMax: number; ordersMin: number; ordersMax: number };
};

export type CustomersRfm = {
  segments: RfmSegmentShare[];
  page: RfmPage;
  options: RfmFilterOptions;
  /** Buyers with a paid order, before filters. */
  buyers: number;
};

// ---------------------------------------------------------------------------
// Recompra
// ---------------------------------------------------------------------------

export type RepurchaseMetric = {
  key: string;
  /** Phrased as the business question, e.g. "Quanto é o total vendido?". */
  question: string;
  unit: MetricUnit;
  goodWhen: "up" | "down";
  metric: MetricValue;
};

export type OrderNumberRow = {
  /** 1..7, where 7 means the seventh or later order. */
  orderNumber: number;
  label: string;
  revenue: number;
  orders: number;
  averageTicket: number | null;
  /** Average days since the customer's first paid order (null for the first). */
  daysFromFirst: number | null;
};

export type CustomersRepurchase = {
  revenue: RepurchaseMetric[];
  orders: RepurchaseMetric[];
  customers: RepurchaseMetric[];
  revenueSeries: Series;
  firstVsRepeat: BreakdownSlice[];
  byOrderNumber: OrderNumberRow[];
};

// ---------------------------------------------------------------------------
// LTV e CAC
// ---------------------------------------------------------------------------

export type LtvCacMetric = {
  key: "ltv" | "cac" | "ltvCacRatio" | "frequency" | "newCustomers";
  label: string;
  unit: MetricUnit;
  goodWhen: "up" | "down";
  metric: MetricValue;
  /** Market reference shown next to the value, e.g. "≥ 3". */
  reference?: string;
};

export type RetentionRow = {
  orderNumber: number;
  label: string;
  customers: number;
  rate: number | null;
};

export type CustomersLtvCac = {
  metrics: LtvCacMetric[];
  ltvSeries: SeriesPoint[];
  cacSeries: SeriesPoint[];
  cpaSeries: SeriesPoint[];
  newCustomersSeries: SeriesPoint[];
  retention: RetentionRow[];
};

export type CustomersScreen =
  | { aba: Extract<CustomersTab, "rfm">; rfm: CustomersRfm }
  | { aba: Extract<CustomersTab, "recompra">; repurchase: CustomersRepurchase }
  | { aba: Extract<CustomersTab, "ltv-cac">; ltvCac: CustomersLtvCac };

/** What Marketing's Retenção pillar reads. */
export type RetentionSummary = {
  repurchaseRate90: number | null;
  ltv12Months: number | null;
};
