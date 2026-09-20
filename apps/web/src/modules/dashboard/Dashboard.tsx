import { useRouteContext } from "@tanstack/react-router";
import { PageHeader } from "@/shared/ui/PageHeader";
import { usePeriod } from "@/shared/hooks/usePeriod";
import { layout } from "@/shared/styles/spacing";
import { cn } from "@/shared/utils/cn";
import { formatPeriodLabel } from "@ecommerce/contracts/shared/format";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import type { DashboardOverview, DashboardWidget } from "@ecommerce/contracts/dashboard";
import {
  AlertsWidget,
  HeadlineWidget,
  MatrixWidget,
  MilestoneWidget,
  RecommendationsWidget,
} from "./DashboardBlocks";
import {
  BySourceWidget,
  ChannelSplitWidget,
  CustomerMixWidget,
  FunnelWidget,
  IndicatorWidget,
  PaidMediaWidget,
  RevenueVsInvestmentWidget,
  TopProductsWidget,
} from "./DashboardCharts";
import { DashboardCustomizer } from "./DashboardCustomizer";

type WidgetProps = {
  widget: DashboardWidget;
  data: DashboardOverview;
  period: PeriodSearch;
  comparisonLabel: string;
  canEdit: boolean;
};

function DashboardWidgetView({ widget, data, period, comparisonLabel, canEdit }: WidgetProps) {
  const block = { data, period, comparisonLabel };
  switch (widget.kind) {
    case "headline":
      return <HeadlineWidget {...block} />;
    case "indicator":
      return <IndicatorWidget data={data} period={period} />;
    case "revenueVsInvestment":
      return <RevenueVsInvestmentWidget data={data} period={period} />;
    case "channelSplit":
      return <ChannelSplitWidget data={data} period={period} />;
    case "bySource":
      return <BySourceWidget data={data} period={period} />;
    case "topProducts":
      return <TopProductsWidget data={data} period={period} />;
    case "customerMix":
      return <CustomerMixWidget data={data} period={period} />;
    case "funnel":
      return <FunnelWidget data={data} period={period} />;
    case "paidMedia":
      return <PaidMediaWidget data={data} period={period} />;
    case "matrix":
      return <MatrixWidget {...block} />;
    case "alerts":
      return <AlertsWidget {...block} />;
    case "milestone":
      return <MilestoneWidget {...block} canEdit={canEdit} />;
    case "recommendations":
      return <RecommendationsWidget {...block} />;
  }
}

export function Dashboard({ data }: { data: DashboardOverview }) {
  const { session } = useRouteContext({ from: "__root__" });
  const canEdit = session?.user.role !== "CLIENT";
  const { period, comparison } = usePeriod();
  const comparisonLabel = comparison
    ? `vs ${formatPeriodLabel(
        comparison.inicio,
        comparison.fim,
        comparison.inicio.slice(0, 4) !== period.inicio.slice(0, 4),
      )}`
    : "sem comparação";

  return (
    <div className={layout.page}>
      <PageHeader
        title="Dashboard"
        subtitle={`Visão consolidada de ${formatPeriodLabel(period.inicio, period.fim)}`}
        action={<DashboardCustomizer layout={data.layout} />}
      />

      <div className={cn(layout.headerGap, "grid gap-6 sm:gap-8")}>
        {data.layout.widgets.map((widget) => (
          <div key={widget.kind} className="min-w-0">
            <DashboardWidgetView
              widget={widget}
              data={data}
              period={period}
              comparisonLabel={comparisonLabel}
              canEdit={canEdit}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
