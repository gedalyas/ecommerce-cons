import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { formatMetric, formatMetricCompact } from "@/lib/metrics";
import type { Granularity } from "@/lib/period";
import { textClass } from "../../tokens/typography";
import type { TimeSeriesChartProps } from "./types";

const bucketOptions: Record<Granularity, Intl.DateTimeFormatOptions> = {
  dia: { day: "2-digit", month: "2-digit" },
  semana: { day: "2-digit", month: "2-digit" },
  mes: { month: "short", year: "2-digit" },
  ano: { year: "numeric" },
};

function bucketLabel(bucket: string, granularity: Granularity) {
  const label = formatDate(`${bucket}T00:00:00`, bucketOptions[granularity]);
  return granularity === "semana" ? `sem. ${label}` : label;
}

type Point = {
  bucket: string;
  current: number;
  previous: number | null;
  previousBucket: string | null;
};

/**
 * Line chart with the comparison window as a dashed line. Points are aligned
 * by position: the n-th bucket of the previous window sits under the n-th
 * bucket of the current one.
 */
export function TimeSeriesChart({
  series,
  unit,
  granularity,
  currentLabel = "Período atual",
  previousLabel = "Período anterior",
  height = "md",
  className,
}: TimeSeriesChartProps) {
  const data: Point[] = series.current.map((p, i) => ({
    bucket: p.bucket,
    current: p.value,
    previous: series.previous?.[i]?.value ?? null,
    previousBucket: series.previous?.[i]?.bucket ?? null,
  }));
  const hasPrevious = series.previous != null;

  return (
    <div className={cn("min-w-0", className)}>
      <div className={cn(textClass.meta, "flex items-center gap-4 text-muted-foreground")}>
        <span className="flex items-center gap-2">
          <span className="h-0.5 w-4 bg-chart-1" /> {currentLabel}
        </span>
        {hasPrevious && (
          <span className="flex items-center gap-2">
            <span className="h-0 w-4 border-t-2 border-dashed border-chart-3" /> {previousLabel}
          </span>
        )}
      </div>
      <div className={cn("mt-4 w-full min-w-0", height === "sm" ? "h-40 sm:h-48" : "h-56 sm:h-72")}>
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
                boxShadow: "0 4px 12px rgba(16, 24, 40, 0.08)",
              }}
              labelStyle={{ color: "var(--background)" }}
              itemStyle={{ color: "var(--background)" }}
              labelFormatter={(v: string) => bucketLabel(v, granularity)}
              formatter={(value: number, name: string, item: { payload?: Point }) => {
                if (name === "previous") {
                  const b = item.payload?.previousBucket;
                  return [
                    formatMetric(value, unit),
                    b ? `${previousLabel} (${bucketLabel(b, granularity)})` : previousLabel,
                  ];
                }
                return [formatMetric(value, unit), currentLabel];
              }}
            />
            {hasPrevious && (
              <Line
                type="monotone"
                dataKey="previous"
                stroke="var(--chart-3)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
                connectNulls
              />
            )}
            <Line
              type="monotone"
              dataKey="current"
              stroke="var(--chart-1)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0, fill: "var(--chart-1)" }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
