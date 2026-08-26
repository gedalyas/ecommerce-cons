import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Megaphone,
  PieChart,
  Target,
  TrendingDown,
  X,
} from "lucide-react";
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

const alertIcons = {
  "trending-down": TrendingDown,
  megaphone: Megaphone,
  "pie-chart": PieChart,
} as const;

function Dashboard() {
  return (
    <div className="mx-auto max-w-5xl space-y-5 px-8 py-7">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão consolidada de agosto de 2026 · Loja Aurora
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {dashboardKpis.map((kpi) => (
          <KpiTile key={kpi.label} kpi={kpi} />
        ))}
      </div>

      <section className="rounded-lg border border-border bg-card">
        <header className="border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-foreground">Precisa da sua atenção</h2>
        </header>
        <ul className="divide-y divide-border">
          {alerts.map((alert) => {
            const Icon = alertIcons[alert.icon];
            return (
              <li key={alert.title} className="flex items-start gap-3 px-5 py-3.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-warning-soft">
                  <Icon className="h-4 w-4 text-warning" />
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{alert.title}</div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{alert.detail}</p>
                </div>
                <Link
                  to={alert.to}
                  className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-primary"
                >
                  {alert.origin} <ArrowRight className="h-3 w-3" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-lg border-2 border-primary/40 bg-card">
        <header className="border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Marco de maturidade</h2>
            <span className="num ml-auto text-xs text-muted-foreground">2 de 4 critérios</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Atingir os 4 critérios libera as áreas bloqueadas: Canais paralelos e Tecnologia.
          </p>
        </header>
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
          {milestoneCriteria.map((c) => (
            <div key={c.name} className="rounded-md border border-border bg-background p-3.5">
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                    c.achieved ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground",
                  )}
                >
                  {c.achieved ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </span>
                <span className="text-sm font-medium leading-snug text-foreground">{c.name}</span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
                <div
                  className={cn("h-full rounded-full", c.achieved ? "bg-success" : "bg-warning")}
                  style={{ width: `${c.progress}%` }}
                />
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">
                <span className={cn("font-medium", c.achieved ? "text-success" : "text-warning")}>
                  {c.achieved ? "Atingido" : "Não atingido"}
                </span>
                {" · "}
                {c.note}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card">
        <header className="border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-foreground">Recomendações em aberto</h2>
        </header>
        <div className="p-5">
          <RecommendationList items={openRecommendations} />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card">
        <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-foreground">
            Faturamento e margem · últimos 12 meses
          </h2>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-chart-1" /> Faturamento
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-chart-2" /> Margem %
            </span>
          </div>
        </header>
        <div className="h-72 p-5">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlySeries} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
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
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  fontSize: 12,
                }}
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
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="margem"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
