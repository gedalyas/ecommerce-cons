import { BarBreakdownChart } from "@/shared/ui/BarBreakdownChart";
import { DualSeriesChart } from "@/shared/ui/DualSeriesChart";
import { metricToTile } from "@/shared/ui/metricToTile";
import { MetricTileGroup } from "@/shared/ui/MetricTileGroup";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { layout } from "@/shared/styles/spacing";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import type { CustomersLtvCac as CustomersLtvCacData } from "@ecommerce/contracts/customers";

/** Unit economics of acquisition; needs the paid-media connection for CAC. */
export function CustomersLtvCac({
  data,
  period,
  comparisonLabel,
}: {
  data: CustomersLtvCacData;
  period: PeriodSearch;
  comparisonLabel: string;
}) {
  const tiles = data.metrics.map((m) =>
    metricToTile({
      label: m.reference ? `${m.label} · ${m.reference}` : m.label,
      metric: m.metric,
      comparisonLabel,
      goodWhen: m.goodWhen,
      fidelity: m.key === "cac" || m.key === "ltvCacRatio" ? "B" : "A",
      fidelityNote:
        m.key === "cac" || m.key === "ltvCacRatio"
          ? "Nível B — investimento em mídia (Meta Ads sem sincronizar) e regras de custo informadas."
          : "Nível A — pedidos pagos e base de clientes.",
    }),
  );
  return (
    <>
      <MetricTileGroup metrics={tiles} />

      <SectionBlock
        title="LTV × CAC no tempo"
        description="LTV = ticket médio × frequência de compra; CAC = investimento em marketing ÷ novos clientes."
        bodyClassName={layout.cardPadding}
      >
        <DualSeriesChart
          left={{ label: "LTV", unit: "currency", points: data.ltvSeries }}
          right={{ label: "CAC", unit: "currency", points: data.cacSeries }}
          granularity={period.por}
        />
      </SectionBlock>

      <SectionBlock
        title="CAC × número de novos clientes no tempo"
        description="Mostra se escalar a aquisição encarece o CAC."
        bodyClassName={layout.cardPadding}
      >
        <DualSeriesChart
          left={{ label: "CAC", unit: "currency", points: data.cacSeries }}
          right={{ label: "Novos clientes", unit: "count", points: data.newCustomersSeries }}
          granularity={period.por}
        />
      </SectionBlock>

      <SectionBlock
        title="CAC × CPA no tempo"
        description="Custo por cliente novo contra custo por conversão."
        bodyClassName={layout.cardPadding}
      >
        <DualSeriesChart
          left={{ label: "CAC", unit: "currency", points: data.cacSeries }}
          right={{ label: "CPA", unit: "currency", points: data.cpaSeries }}
          granularity={period.por}
        />
      </SectionBlock>

      <SectionBlock
        title="Taxa de retenção por número de pedidos"
        description="Percentual de clientes que avançam do pedido n para o n+1, sobre toda a base."
        bodyClassName={layout.cardPadding}
      >
        <BarBreakdownChart
          items={data.retention.map((r) => ({
            key: String(r.orderNumber),
            label: `${r.label} → ${r.orderNumber + 1}º`,
            value: r.rate,
          }))}
          unit="percent"
          valueLabel="Retenção"
        />
      </SectionBlock>
    </>
  );
}
