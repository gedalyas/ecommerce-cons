import { cn } from "@/shared/utils/cn";
import { formatMetric } from "@/shared/utils/metricFormat";
import type { MetricUnit } from "@ecommerce/contracts/shared/metric.types";
import { radiusClass } from "@/shared/styles/radius";
import { textClass } from "@/shared/styles/typography";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/Tooltip";
import { brazilStates, intensityOf, type BrazilState } from "./brazilTileMap.types";

const tilePosition: Record<BrazilState, { col: number; row: number }> = {
  RR: { col: 2, row: 0 },
  AP: { col: 3, row: 0 },
  AM: { col: 0, row: 1 },
  PA: { col: 2, row: 1 },
  MA: { col: 3, row: 1 },
  CE: { col: 4, row: 1 },
  RN: { col: 5, row: 1 },
  AC: { col: 0, row: 2 },
  RO: { col: 1, row: 2 },
  TO: { col: 2, row: 2 },
  PI: { col: 3, row: 2 },
  PE: { col: 4, row: 2 },
  PB: { col: 5, row: 2 },
  MT: { col: 1, row: 3 },
  DF: { col: 2, row: 3 },
  BA: { col: 3, row: 3 },
  SE: { col: 4, row: 3 },
  AL: { col: 5, row: 3 },
  MS: { col: 1, row: 4 },
  GO: { col: 2, row: 4 },
  MG: { col: 3, row: 4 },
  ES: { col: 4, row: 4 },
  SP: { col: 2, row: 5 },
  RJ: { col: 3, row: 5 },
  PR: { col: 2, row: 6 },
  SC: { col: 2, row: 7 },
  RS: { col: 2, row: 8 },
};

const intensityClass = [
  "bg-muted",
  "bg-primary/15",
  "bg-primary/30",
  "bg-primary/55",
  "bg-primary",
];
const inkClass = [
  "text-muted-foreground",
  "text-foreground",
  "text-foreground",
  "text-primary-foreground",
  "text-primary-foreground",
];

export type TileValue = { state: string; value: number | null };

export function BrazilTileMap({
  values,
  unit,
  valueLabel,
  className,
}: {
  values: TileValue[];
  unit: MetricUnit;
  valueLabel: string;
  className?: string;
}) {
  const byState = new Map(values.map((v) => [v.state, v.value]));
  const max = Math.max(0, ...values.map((v) => v.value ?? 0));
  return (
    <div className={cn("min-w-0 overflow-x-auto", className)}>
      <div
        role="img"
        aria-label={`Mapa do Brasil por estado: ${valueLabel}`}
        className="grid w-fit gap-1"
        style={{ gridTemplateColumns: "repeat(6, 2.75rem)", gridAutoRows: "2.75rem" }}
      >
        {brazilStates.map((state) => {
          const value = byState.get(state) ?? null;
          const level = intensityOf(value, max);
          const { col, row } = tilePosition[state];
          return (
            <Tooltip key={state}>
              <TooltipTrigger asChild>
                <div
                  tabIndex={0}
                  className={cn(
                    "flex items-center justify-center",
                    radiusClass.badge,
                    textClass.label,
                    intensityClass[level],
                    inkClass[level],
                  )}
                  style={{ gridColumn: col + 1, gridRow: row + 1 }}
                >
                  {state}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {state} · {valueLabel}: {formatMetric(value, unit)}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
