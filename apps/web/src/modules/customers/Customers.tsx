import { PageHeader } from "@/shared/ui/PageHeader";
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
  const { period, comparison } = usePeriod();
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
