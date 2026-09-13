import { ResponsiveContainer, Treemap } from "recharts";
import { cn } from "@/shared/utils/cn";
import { formatMetric } from "@ecommerce/contracts/shared/metricFormat";
import type { MetricUnit } from "@ecommerce/contracts/shared/metric.types";
import { textClass } from "@/shared/styles/typography";

export type TreemapItem = { key: string; label: string; value: number; share: number };

/** Ramp from the accent to the neutral greys, darkest for the largest tile. */
const fills = [
  "var(--chart-1)",
  "color-mix(in srgb, var(--chart-1) 80%, white)",
  "color-mix(in srgb, var(--chart-1) 62%, white)",
  "color-mix(in srgb, var(--chart-1) 46%, white)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

type TileProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  name?: string;
  value?: number;
  share?: number;
  unit: MetricUnit;
};

function Tile({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  index = 0,
  name,
  value,
  share,
  unit,
}: TileProps) {
  const fill = fills[Math.min(index, fills.length - 1)]!;
  const dark = index < 3;
  const showText = width > 72 && height > 40;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={fill}
        stroke="var(--background)"
        strokeWidth={2}
      />
      {showText && (
        <>
          <text
            x={x + 8}
            y={y + 18}
            fill={dark ? "var(--primary-foreground)" : "var(--foreground)"}
            fontSize={13}
            fontWeight={600}
          >
            {name}
          </text>
          <text
            x={x + 8}
            y={y + 34}
            fill={dark ? "var(--primary-foreground)" : "var(--muted-foreground)"}
            fontSize={12}
          >
            {formatMetric(value ?? 0, unit)} · {Math.round(share ?? 0)}%
          </text>
        </>
      )}
    </g>
  );
}

/** Area proportional to the value; the legend lists every item so small tiles stay readable. */
export function TreemapChart({
  items,
  unit,
  className,
}: {
  items: TreemapItem[];
  unit: MetricUnit;
  className?: string;
}) {
  const data = [...items]
    .sort((a, b) => b.value - a.value)
    .map((i) => ({ name: i.label, value: i.value, share: i.share, key: i.key }));

  if (data.length === 0) {
    return (
      <p className={cn(textClass.meta, "py-8 text-center text-muted-foreground", className)}>
        Não há dados disponíveis para os filtros selecionados.
      </p>
    );
  }

  return (
    <div className={cn("min-w-0", className)}>
      <div className="h-64 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey="value"
            nameKey="name"
            isAnimationActive={false}
            content={<Tile unit={unit} />}
          />
        </ResponsiveContainer>
      </div>
      <ul className="mt-4 grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((d, i) => (
          <li key={d.key} className="flex items-center gap-2 text-[13px] leading-[18px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ background: fills[Math.min(i, fills.length - 1)] }}
            />
            <span className="min-w-0 flex-1 truncate text-foreground">{d.name}</span>
            <span className={cn(textClass.numeric, "shrink-0 text-muted-foreground")}>
              {formatMetric(d.value, unit)} · {Math.round(d.share)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
