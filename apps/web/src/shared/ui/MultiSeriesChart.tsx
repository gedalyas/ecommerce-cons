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
import type { MetricUnit, SeriesPoint } from "@/shared/models/types/metric.types";
import type { Granularity } from "@/shared/utils/period";
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

const strokes = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export type MultiSeries = { key: string; label: string; points: SeriesPoint[] };

/** Up to five lines of the same unit over the same buckets. */
export function MultiSeriesChart({
  series,
  unit,
  granularity,
  className,
}: {
  series: MultiSeries[];
  unit: MetricUnit;
  granularity: Granularity;
  className?: string;
}) {
  const buckets = series[0]?.points.map((p) => p.bucket) ?? [];
  const maps = series.map((s) => new Map(s.points.map((p) => [p.bucket, p.value])));
  const data = buckets.map((bucket) => {
    const row: Record<string, string | number | null> = { bucket };
    series.forEach((s, i) => {
      row[s.key] = maps[i]!.get(bucket) ?? null;
    });
    return row;
  });
  const labels = new Map(series.map((s) => [s.key, s.label]));

  return (
    <div className={cn("min-w-0", className)}>
      <div
        className={cn(textClass.meta, "flex flex-wrap items-center gap-4 text-muted-foreground")}
      >
        {series.map((s, i) => (
          <span key={s.key} className="flex items-center gap-2">
            <span className="h-0.5 w-4" style={{ background: strokes[i % strokes.length] }} />
            {s.label}
          </span>
        ))}
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
              tickFormatter={(v: number) => formatMetricCompact(v, unit)}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              stroke="var(--border)"
              width={52}
            />
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
              formatter={(value: number, name: string) => [
                formatMetric(value, unit),
                labels.get(name) ?? name,
              ]}
            />
            {series.map((s, i) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={strokes[i % strokes.length]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
