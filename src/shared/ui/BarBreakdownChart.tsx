import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/shared/utils/cn";
import { formatMetric, formatMetricCompact } from "@/shared/utils/metricFormat";
import type { MetricUnit } from "@/shared/models/types/metric.types";
import { textClass } from "@/shared/styles/typography";

export type BarItem = { key: string; label: string; value: number | null };

/** One value per category (order number, segment, ...). */
export function BarBreakdownChart({
  items,
  unit,
  valueLabel = "Valor",
  className,
}: {
  items: BarItem[];
  unit: MetricUnit;
  valueLabel?: string;
  className?: string;
}) {
  if (items.length === 0) {
    return (
      <p className={cn(textClass.meta, "py-8 text-center text-muted-foreground", className)}>
        Não há dados disponíveis para os filtros selecionados.
      </p>
    );
  }
  return (
    <div className={cn("h-48 w-full min-w-0 sm:h-56", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={items} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
          />
          <YAxis
            tickFormatter={(v: number) => formatMetricCompact(v, unit)}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            stroke="var(--border)"
            width={52}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)" }}
            contentStyle={{
              borderRadius: 6,
              border: "none",
              background: "var(--foreground)",
              color: "var(--background)",
              fontSize: 13,
            }}
            labelStyle={{ color: "var(--background)" }}
            itemStyle={{ color: "var(--background)" }}
            formatter={(value: number) => [formatMetric(value, unit), valueLabel]}
          />
          <Bar
            dataKey="value"
            fill="var(--chart-1)"
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
