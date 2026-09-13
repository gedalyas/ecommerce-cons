import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/shared/utils/cn";
import { formatDate } from "@/shared/utils/format";
import { formatMetric, formatMetricCompact } from "@/shared/utils/metricFormat";
import type { MetricUnit, SeriesPoint } from "@ecommerce/contracts/shared/metric.types";
import type { Granularity } from "@ecommerce/contracts/shared/period";
import { textClass } from "@/shared/styles/typography";

const bucketOptions: Record<Granularity, Intl.DateTimeFormatOptions> = {
  dia: { day: "2-digit", month: "2-digit" },
  semana: { day: "2-digit", month: "2-digit" },
  mes: { month: "short", year: "2-digit" },
  ano: { year: "numeric" },
};

const bucketLabel = (bucket: string, granularity: Granularity) => {
  const label = formatDate(`${bucket}T00:00:00`, bucketOptions[granularity]);
  return granularity === "semana" ? `sem. ${label}` : label;
};

export type DualSeries = { label: string; unit: MetricUnit; points: SeriesPoint[] };

/** Two metrics over the same buckets, each on its own axis when the units differ. */
export function DualSeriesChart({
  left,
  right,
  granularity,
  className,
}: {
  left: DualSeries;
  right: DualSeries;
  granularity: Granularity;
  className?: string;
}) {
  const rightMap = new Map(right.points.map((p) => [p.bucket, p.value]));
  const data = left.points.map((p) => ({
    bucket: p.bucket,
    left: p.value,
    right: rightMap.get(p.bucket) ?? null,
  }));
  const sameUnit = left.unit === right.unit;

  return (
    <div className={cn("min-w-0", className)}>
      <div className={cn(textClass.meta, "flex items-center gap-4 text-muted-foreground")}>
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-4 bg-chart-1" /> {left.label}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-4 bg-chart-2" /> {right.label}
        </span>
      </div>
      <div className="mt-4 h-56 w-full min-w-0 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis
              dataKey="bucket"
              tickFormatter={(v: string) => bucketLabel(v, granularity)}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              stroke="var(--border)"
              minTickGap={24}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(v: number) => formatMetricCompact(v, left.unit)}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              stroke="var(--border)"
              width={52}
            />
            {!sameUnit && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(v: number) => formatMetricCompact(v, right.unit)}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                stroke="var(--border)"
                width={52}
              />
            )}
            <ChartTooltip
              contentStyle={{
                borderRadius: 6,
                border: "none",
                background: "var(--foreground)",
                color: "var(--background)",
                fontSize: 13,
              }}
              labelStyle={{ color: "var(--background)" }}
              itemStyle={{ color: "var(--background)" }}
              labelFormatter={(v: string) => bucketLabel(v, granularity)}
              formatter={(value: number, name: string) =>
                name === "left"
                  ? [formatMetric(value, left.unit), left.label]
                  : [formatMetric(value, right.unit), right.label]
              }
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="left"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId={sameUnit ? "left" : "right"}
              type="monotone"
              dataKey="right"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
