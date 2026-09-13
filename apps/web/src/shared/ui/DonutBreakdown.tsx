import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { cn } from "@/shared/utils/cn";
import { formatPercent } from "@ecommerce/contracts/shared/format";
import { formatMetric } from "@ecommerce/contracts/shared/metricFormat";
import { textClass } from "@/shared/styles/typography";
import type { DonutBreakdownProps } from "./donutBreakdown.types";

export type { DonutBreakdownProps } from "./donutBreakdown.types";

/** Slice colors in order: accent first, then the neutral ramp, orange last. */
const sliceColors = [
  "var(--chart-1)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-2)",
] as const;

const colorFor = (index: number) => sliceColors[index % sliceColors.length]!;

/** Share of a total: a ring plus a legend table with value and percentage. */
export function DonutBreakdown({
  slices,
  unit,
  totalLabel = "Total",
  className,
}: DonutBreakdownProps) {
  const total = slices.reduce((s, x) => s + x.value, 0);

  if (slices.length === 0) {
    return (
      <p className={cn(textClass.meta, "py-8 text-center text-muted-foreground", className)}>
        Não há dados disponíveis para os filtros selecionados.
      </p>
    );
  }

  return (
    <div className={cn("grid items-center gap-6 sm:grid-cols-[176px_1fr]", className)}>
      <div className="relative mx-auto h-44 w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={1}
              stroke="none"
              isAnimationActive={false}
            >
              {slices.map((s, i) => (
                <Cell key={s.key} fill={colorFor(i)} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(textClass.numeric, "text-[17px] font-semibold leading-6 text-foreground")}
          >
            {formatMetric(total, unit)}
          </span>
          <span className={cn(textClass.meta, "text-muted-foreground")}>{totalLabel}</span>
        </div>
      </div>

      <ul className="min-w-0 divide-y divide-border">
        {slices.map((s, i) => (
          <li key={s.key} className="flex items-center gap-3 py-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: colorFor(i) }} />
            <span className="min-w-0 flex-1 truncate text-[15px] text-foreground">{s.label}</span>
            <span className={cn(textClass.numeric, textClass.meta, "shrink-0 text-foreground")}>
              {formatMetric(s.value, unit)}
            </span>
            <span
              className={cn(
                textClass.numeric,
                textClass.meta,
                "w-14 shrink-0 text-right text-muted-foreground",
              )}
            >
              {formatPercent(s.share)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
