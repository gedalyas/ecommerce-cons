import { Link } from "@tanstack/react-router";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { MetricTileGroup } from "@/design-system/patterns/MetricTileGroup";
import { PageHeader } from "@/design-system/patterns/PageHeader";
import { RecommendationList } from "@/design-system/patterns/RecommendationList";
import { SectionBlock } from "@/design-system/patterns/SectionBlock";
import { layout } from "@/design-system/tokens/spacing";
import { textClass } from "@/design-system/tokens/typography";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/format";
import {
  alerts,
  dashboardKpis,
  milestoneCriteria,
  monthlySeries,
  openRecommendations,
} from "./data/dashboard";

export function DashboardPage() {
  return (
    <div className={layout.page}>
      <PageHeader title="Dashboard" subtitle="Visão consolidada de agosto de 2026 · Loja Aurora" />

      <div className={cn(layout.headerGap, layout.blockStack)}>
        <MetricTileGroup metrics={dashboardKpis} />

        <SectionBlock
          title="Precisa da sua atenção"
          tone="warning"
          bodyClassName={layout.cardPaddingX}
        >
          <ul className="divide-y divide-border">
            {alerts.map((alert) => (
              <li key={alert.title} className="group">
                <Link to={alert.to} className="flex flex-wrap items-start gap-3 py-4 no-underline">
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-foreground">{alert.title}</div>
                    <p className={cn(textClass.meta, "mt-1 text-muted-foreground")}>
                      {alert.detail}
                    </p>
                  </div>
                  <span className="shrink-0 text-right text-[13px] text-muted-foreground transition-colors duration-150 group-hover:text-primary">
                    {alert.origin}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </SectionBlock>

        <SectionBlock
          title="Marco de maturidade"
          tone="highlight"
          meta={
            <span className={cn(textClass.numeric, textClass.meta, "text-muted-foreground")}>
              2 de 4 critérios
            </span>
          }
          description="Atingir os 4 critérios libera as áreas bloqueadas: Canais paralelos e Tecnologia."
          bodyClassName="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4"
        >
          {milestoneCriteria.map((c) => (
            <div key={c.name} className="min-w-0 rounded-lg border border-border bg-card p-5">
              <div className="text-[15px] font-semibold leading-6 text-foreground">{c.name}</div>
              <div className="mt-3 h-1 w-full overflow-hidden rounded-sm bg-muted">
                <div
                  className={cn("h-full rounded-sm", c.achieved ? "bg-primary" : "bg-warning")}
                  style={{ width: `${c.progress}%` }}
                />
              </div>
              <div className={cn(textClass.meta, "mt-2 text-muted-foreground")}>
                <span className={cn("font-semibold", c.achieved ? "text-primary" : "text-warning")}>
                  {c.achieved ? "Atingido" : "Não atingido"}
                </span>
                {" · "}
                {c.note}
              </div>
            </div>
          ))}
        </SectionBlock>

        <SectionBlock title="Recomendações em aberto" bodyClassName={layout.cardPaddingX}>
          <RecommendationList items={openRecommendations} />
        </SectionBlock>

        <section>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={cn(textClass.cardTitle, "text-foreground")}>
              Faturamento e margem · últimos 12 meses
            </h2>
            <div className={cn(textClass.meta, "flex items-center gap-4 text-muted-foreground")}>
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-4 bg-chart-1" /> Faturamento
              </span>
              <span className="flex items-center gap-2">
                <span className="h-0.5 w-4 bg-chart-2" /> Margem %
              </span>
            </div>
          </div>
          <div className="mt-6 h-56 w-full min-w-0 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySeries} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="var(--grid)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  stroke="var(--border)"
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  stroke="var(--border)"
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[14, 26]}
                  tickFormatter={(v: number) => `${v}%`}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  stroke="var(--border)"
                />
                <ChartTooltip
                  contentStyle={{
                    borderRadius: 6,
                    border: "none",
                    background: "var(--foreground)",
                    color: "var(--background)",
                    fontSize: 13,
                    boxShadow: "0 4px 12px rgba(16, 24, 40, 0.08)",
                  }}
                  labelStyle={{ color: "var(--background)" }}
                  itemStyle={{ color: "var(--background)" }}
                  formatter={(value: number, name: string) =>
                    name === "revenue"
                      ? [formatCurrency(value), "Faturamento"]
                      : [formatPercent(value), "Margem"]
                  }
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="margin"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
