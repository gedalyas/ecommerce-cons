import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { metricToTile } from "@/shared/ui/metricToTile";
import { MetricTileGroup } from "@/shared/ui/MetricTileGroup";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { cn } from "@/shared/utils/cn";
import {
  formatCurrency,
  formatDate,
  formatPeriodLabel,
  formatVariation,
} from "@/shared/utils/format";
import { variationOf } from "@ecommerce/contracts/shared/metricValue";
import type { Granularity, PeriodSearch } from "@ecommerce/contracts/shared/period";
import type { DreMatrixRow, MoneyDre as MoneyDreData } from "@ecommerce/contracts/money";

const bucketHeader = (bucket: string, por: Granularity) => {
  const date = `${bucket}T00:00:00`;
  switch (por) {
    case "dia":
      return formatDate(date);
    case "semana":
      return `sem. ${formatDate(date)}`;
    case "mes":
      return formatDate(date, { month: "short", year: "2-digit" });
    case "ano":
      return formatDate(date, { year: "numeric" });
  }
};

const round2 = (v: number | null) => (v == null ? null : Math.round(v * 100) / 100);

/** Indicadores gerenciais + the managerial income statement as a metric × bucket matrix. */
export function MoneyDre({
  data,
  period,
  comparisonLabel,
}: {
  data: MoneyDreData;
  period: PeriodSearch;
  comparisonLabel: string;
}) {
  const tiles = data.indicators.map((i) =>
    metricToTile({
      label: i.label,
      metric: i.metric,
      comparisonLabel,
      goodWhen: i.goodWhen,
      fidelity: "B",
      fidelityNote:
        "Nível B — calculado sobre pedidos pagos e as regras de custo informadas pelo cliente.",
    }),
  );

  const columns: DataTableColumn<DreMatrixRow>[] = [
    {
      key: "line",
      header: "Linha",
      render: (r) => (
        <span
          className={cn(
            r.level === 0 && "font-semibold",
            r.level > 0 && "pl-4 text-muted-foreground",
          )}
        >
          {r.label}
        </span>
      ),
      csv: (r) => r.label,
      className: "whitespace-nowrap",
    },
    {
      key: "total",
      header: "Período",
      align: "right",
      render: (r) => (
        <span className={cn(r.level === 0 && "font-semibold")}>
          {formatCurrency(r.total)}
          {r.previousTotal != null && variationOf(r.total, r.previousTotal) != null && (
            <span className="ml-2 text-[12px] text-muted-foreground">
              {formatVariation(variationOf(r.total, r.previousTotal)!)}
            </span>
          )}
        </span>
      ),
      csv: (r) => round2(r.total),
      className: "whitespace-nowrap",
    },
    ...data.matrix.buckets.map((bucket, i) => ({
      key: bucket,
      header: bucketHeader(bucket, period.por),
      align: "right" as const,
      render: (r: DreMatrixRow) => formatCurrency(r.values[i] ?? 0),
      csv: (r: DreMatrixRow) => round2(r.values[i] ?? 0),
      className: "whitespace-nowrap",
    })),
  ];

  return (
    <>
      <SectionBlock
        title="Indicadores gerenciais"
        description="Margens e taxas do período, comparadas com a janela anterior."
      >
        <MetricTileGroup metrics={tiles} bare />
      </SectionBlock>

      <SectionBlock
        title="Análise financeira"
        description={`DRE gerencial de ${formatPeriodLabel(period.inicio, period.fim)}: receita → custos → lucro bruto → marketing → margem de contribuição → operacional → lucro líquido.`}
      >
        <DataTable
          columns={columns}
          rows={data.matrix.rows}
          rowKey={(r) => r.key}
          initialPageSize={20}
          pageSizeOptions={[20]}
          csvFileName={`dre-${period.inicio}-${period.fim}`}
        />
      </SectionBlock>
    </>
  );
}
