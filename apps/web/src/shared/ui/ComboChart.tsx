import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
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

export type ComboSeries = { label: string; unit: MetricUnit; points: SeriesPoint[] };

/** Bars for one measure, a line for another, each on its own axis. */
export function ComboChart({
  bars,
  line,
  granularity,
  className,
}: {
  bars: ComboSeries;
  line: ComboSeries;
  granularity: Granularity;
  className?: string;
}) {
  const lineMap = new Map(line.points.map((p) => [p.bucket, p.value]));
  const data = bars.points.map((p) => ({
    bucket: p.bucket,
    bars: p.value,
    line: lineMap.get(p.bucket) ?? null,
  }));

  return (
    <div className={cn("min-w-0", className)}>
      <div className={cn(textClass.meta, "flex items-center gap-4 text-muted-foreground")}>
        <span className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-chart-1" /> {bars.label}
        </span>
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-4 bg-chart-2" /> {line.label}
        </span>
      </div>
      <div className="mt-4 h-56 w-full min-w-0 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="var(--grid)" vertical={false} />
            <XAxis
              dataKey="bucket"
              tickFormatter={(v: string) => bucketLabel(v, granularity)}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              stroke="var(--border)"
              minTickGap={24}
            />
            <YAxis
              yAxisId="bars"
              tickFormatter={(v: number) => formatMetricCompact(v, bars.unit)}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              stroke="var(--border)"
              width={52}
            />
            <YAxis
              yAxisId="line"
              orientation="right"
              tickFormatter={(v: number) => formatMetricCompact(v, line.unit)}
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              stroke="var(--border)"
              width={52}
            />
            <ChartTooltip
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
              labelFormatter={(v: string) => bucketLabel(v, granularity)}
              formatter={(value: number, name: string) =>
                name === "bars"
                  ? [formatMetric(value, bars.unit), bars.label]
                  : [formatMetric(value, line.unit), line.label]
              }
            />
            <Bar
              yAxisId="bars"
              dataKey="bars"
              fill="var(--chart-1)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
            <Line
              yAxisId="line"
              type="monotone"
              dataKey="line"
              stroke="var(--chart-2)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
