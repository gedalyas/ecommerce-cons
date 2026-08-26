import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { KpiTile } from "@/components/KpiTile";
import { PageHeader } from "@/components/PageHeader";
import { RecommendationList } from "@/components/RecommendationList";
import {
  alerts,
  dashboardKpis,
  milestoneCriteria,
  monthlySeries,
  openRecommendations,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Loja Aurora | Consultoria de e-commerce" },
      {
        name: "description",
        content:
          "Painel de consultoria de e-commerce da Loja Aurora: faturamento, margem, CAC, recompra, alertas e marco de maturidade.",
      },
      { property: "og:title", content: "Dashboard · Loja Aurora" },
      {
        property: "og:description",
        content: "Faturamento, margem, CAC e recompra da Loja Aurora em um só painel de consultoria.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl px-4 pb-12 sm:px-6 xl:px-8">
      <PageHeader title="Dashboard" subtitle="Visão consolidada de agosto de 2026 · Loja Aurora" />

      <div className="mt-6 space-y-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
          {dashboardKpis.map((kpi) => (
            <KpiTile key={kpi.label} kpi={kpi} />
          ))}
        </div>

        <section className="overflow-hidden rounded-lg border border-border border-l-[3px] border-l-warning bg-card shadow-sm">
          <header className="border-b border-border px-5 py-4">
            <h2 className="t-card-title text-foreground">Precisa da sua atenção</h2>
          </header>
          <ul className="divide-y divide-border px-5">
            {alerts.map((alert) => (
              <li key={alert.title} className="group">
                <Link
                  to={alert.to}
                  className="flex flex-wrap items-start gap-3 py-4 no-underline"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-foreground">{alert.title}</div>
                    <p className="t-meta mt-1 text-muted-foreground">{alert.detail}</p>
                  </div>
                  <span className="shrink-0 text-right text-[13px] text-muted-foreground transition-colors duration-150 group-hover:text-primary">
                    {alert.origin}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>


        <section className="rounded-lg border border-primary bg-success-soft shadow-sm">
          <header className="border-b border-border px-5 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="t-card-title text-foreground">Marco de maturidade</h2>
              <span className="num t-meta text-muted-foreground">2 de 4 critérios</span>
            </div>
            <p className="t-meta mt-1 text-muted-foreground">
              Atingir os 4 critérios libera as áreas bloqueadas: Canais paralelos e Tecnologia.
            </p>
          </header>
          <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
            {milestoneCriteria.map((c) => (
              <div key={c.name} className="min-w-0 rounded-lg border border-border bg-card p-5">
                <div className="text-[15px] font-semibold leading-6 text-foreground">{c.name}</div>
                <div className="mt-3 h-1 w-full overflow-hidden rounded-sm bg-muted">
                  <div
                    className={cn("h-full rounded-sm", c.achieved ? "bg-primary" : "bg-warning")}
                    style={{ width: `${c.progress}%` }}
                  />
                </div>
                <div className="t-meta mt-2 text-muted-foreground">
                  <span className={cn("font-semibold", c.achieved ? "text-primary" : "text-warning")}>
                    {c.achieved ? "Atingido" : "Não atingido"}
                  </span>
                  {" · "}
                  {c.note}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card shadow-sm">
          <header className="border-b border-border px-5 py-4">
            <h2 className="t-card-title text-foreground">Recomendações em aberto</h2>
          </header>
          <div className="p-5">
            <RecommendationList items={openRecommendations} />
          </div>
        </section>

        <section className="pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="t-card-title text-foreground">Faturamento e margem · últimos 12 meses</h2>
            <div className="t-meta flex items-center gap-4 text-muted-foreground">
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
                  dataKey="mes"
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
                    name === "faturamento"
                      ? [`R$ ${value.toLocaleString("pt-BR")}`, "Faturamento"]
                      : [`${value}%`, "Margem"]
                  }
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="faturamento"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={false}
                  isAnimationActive={false}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="margem"
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
