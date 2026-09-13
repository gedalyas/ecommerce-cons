import { ChannelToggle } from "@/shared/ui/ChannelToggle";
import { PageHeader } from "@/shared/ui/PageHeader";
import { PeriodSelector } from "@/shared/ui/PeriodSelector";
import { TabBar } from "@/shared/ui/TabBar";
import { usePeriod } from "@/shared/hooks/usePeriod";
import { layout } from "@/shared/styles/spacing";
import { cn } from "@/shared/utils/cn";
import { formatPeriodLabel } from "@ecommerce/contracts/shared/format";
import type { OrdersScreen } from "@ecommerce/contracts/orders";
import { OrdersApproval } from "./OrdersApproval";
import { OrdersList } from "./OrdersList";
import { OrdersRegions } from "./OrdersRegions";
import { OrdersSummary } from "./OrdersSummary";
import { useOrdersSearch } from "./useOrdersSearch";

const tabs = [
  { key: "resumo", label: "Resumo" },
  { key: "aprovacao", label: "Aprovação" },
  { key: "lista", label: "Lista" },
  { key: "regioes", label: "Regiões" },
] as const;

export function Orders({ data }: { data: OrdersScreen }) {
  const { period, setPeriod } = usePeriod();
  const { search, patch } = useOrdersSearch();

  return (
    <div className={layout.page}>
      <PageHeader
        title="Pedidos"
        subtitle={`Captura, aprovação e detalhe dos pedidos de ${formatPeriodLabel(period.inicio, period.fim)}`}
      />

      <div className={cn(layout.headerGap, layout.blockStack)}>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodSelector value={period} onChange={setPeriod} />
          <ChannelToggle value={period.canal} onChange={(canal) => setPeriod({ canal })} />
        </div>

        <TabBar tabs={tabs} value={data.aba} onChange={(aba) => patch({ aba })} />

        {data.aba === "resumo" && <OrdersSummary data={data.summary} period={period} />}
        {data.aba === "aprovacao" && (
          <OrdersApproval
            data={data.approval}
            options={data.options}
            search={search}
            period={period}
            onPatch={patch}
          />
        )}
        {data.aba === "lista" && (
          <OrdersList
            data={data.list}
            options={data.options}
            search={search}
            period={period}
            onPatch={patch}
          />
        )}
        {data.aba === "regioes" && (
          <OrdersRegions
            data={data.regions}
            options={data.options}
            search={search}
            period={period}
            onPatch={patch}
          />
        )}
      </div>
    </div>
  );
}
