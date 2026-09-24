import type { DataTableColumn, DataTableHeat } from "@/shared/ui/DataTable";
import { explanationOf } from "@ecommerce/contracts/glossary";
import { formatDuration, formatNumber, formatPercent } from "@ecommerce/contracts/shared/format";
import type { SiteAudienceRow, SitePageRow, SiteRegionRow } from "@ecommerce/contracts/marketing";

type Format = "count" | "percent" | "duration";

const formatters: Record<Format, (v: number) => string> = {
  count: (v) => formatNumber(v),
  percent: (v) => formatPercent(v),
  duration: (v) => formatDuration(v),
};

const round2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);

function numeric<T>(
  key: keyof T & string,
  header: string,
  format: Format,
  options: { term?: string; heat?: DataTableHeat } = {},
): DataTableColumn<T> {
  const valueOf = (r: T) => {
    const v = r[key];
    return typeof v === "number" ? v : null;
  };
  return {
    key,
    header,
    align: "right",
    render: (r) => {
      const v = valueOf(r);
      return v == null ? "—" : formatters[format](v);
    },
    csv: (r) => round2(valueOf(r)),
    sortValue: valueOf,
    hint: explanationOf(options.term ?? key),
    ...(options.heat ? { heat: options.heat } : {}),
  };
}

export function audienceColumns(title: string): DataTableColumn<SiteAudienceRow>[] {
  return [
    {
      key: "label",
      header: title,
      render: (r) => r.label,
      sortValue: (r) => r.label,
      className: "font-semibold",
      mobile: "title",
    },
    numeric("sessions", "Sessões", "count"),
    numeric("engagementRate", "Engajamento", "percent", { heat: "good-high" }),
    numeric("purchases", "Compras informadas", "count", { term: "gaPurchases" }),
    numeric("purchaseRate", "Compras por sessão", "percent", { heat: "good-high" }),
  ];
}

export const pageColumns: DataTableColumn<SitePageRow>[] = [
  {
    key: "path",
    header: "Página",
    render: (r) => r.path,
    sortValue: (r) => r.path,
    className: "max-w-72 truncate font-semibold",
    mobile: "title",
  },
  numeric("pageViews", "Visualizações", "count"),
  numeric("sessions", "Sessões", "count"),
  numeric("engagementRate", "Engajamento", "percent", { heat: "good-high" }),
  numeric("averageDuration", "Duração média", "duration"),
];

export const regionColumns: DataTableColumn<SiteRegionRow>[] = [
  {
    key: "province",
    header: "Estado",
    render: (r) => r.province,
    sortValue: (r) => r.province,
    className: "font-semibold",
    mobile: "title",
  },
  numeric("sessions", "Sessões", "count"),
  numeric("pageViews", "Visualizações", "count"),
  numeric("engagementRate", "Engajamento", "percent", { heat: "good-high" }),
  numeric("purchases", "Compras informadas", "count", { term: "gaPurchases" }),
  numeric("purchaseRate", "Compras por sessão", "percent", { heat: "good-high" }),
];
