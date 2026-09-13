import { ChannelToggle } from "@/shared/ui/ChannelToggle";
import { PageHeader } from "@/shared/ui/PageHeader";
import { PeriodSelector } from "@/shared/ui/PeriodSelector";
import { TabBar } from "@/shared/ui/TabBar";
import { usePeriod } from "@/shared/hooks/usePeriod";
import { layout } from "@/shared/styles/spacing";
import { cn } from "@/shared/utils/cn";
import { formatPeriodLabel } from "@ecommerce/contracts/shared/format";
import type { CustomersScreen } from "@ecommerce/contracts/customers";
import { CustomersLtvCac } from "./CustomersLtvCac";
import { CustomersRepurchase } from "./CustomersRepurchase";
import { CustomersRfm } from "./CustomersRfm";
import { useCustomersSearch } from "./useCustomersSearch";

const tabs = [
  { key: "rfm", label: "Clientes (RFM)" },
  { key: "recompra", label: "Recompra" },
  { key: "ltv-cac", label: "LTV e CAC" },
] as const;

export function Customers({ data }: { data: CustomersScreen }) {
  const { period, setPeriod, comparison } = usePeriod();
  const { search, patch } = useCustomersSearch();
  const comparisonLabel = comparison
    ? `vs ${formatPeriodLabel(comparison.inicio, comparison.fim)}`
    : "sem comparação";

  return (
    <div className={layout.page}>
      <PageHeader
        title="Clientes"
        subtitle={
          data.aba === "rfm"
            ? "Segmentação RFM sobre toda a base"
            : `Recompra e economia da aquisição em ${formatPeriodLabel(period.inicio, period.fim)}`
        }
      />

      <div className={cn(layout.headerGap, layout.blockStack)}>
        {data.aba !== "rfm" && (
          <div className="flex flex-wrap items-center gap-2">
            <PeriodSelector value={period} onChange={setPeriod} />
            <ChannelToggle value={period.canal} onChange={(canal) => setPeriod({ canal })} />
          </div>
        )}

        <TabBar tabs={tabs} value={data.aba} onChange={(aba) => patch({ aba })} />

        {data.aba === "rfm" && (
          <CustomersRfm data={data.rfm} search={search} period={period} onPatch={patch} />
        )}
        {data.aba === "recompra" && (
          <CustomersRepurchase
            data={data.repurchase}
            period={period}
            comparisonLabel={comparisonLabel}
          />
        )}
        {data.aba === "ltv-cac" && (
          <CustomersLtvCac data={data.ltvCac} period={period} comparisonLabel={comparisonLabel} />
        )}
      </div>
    </div>
  );
}
