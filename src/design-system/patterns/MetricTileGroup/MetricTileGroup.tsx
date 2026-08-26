import { MetricTile } from "../MetricTile";
import { radiusClass } from "../../tokens/radius";
import { shadowClass } from "../../tokens/shadows";
import { cn } from "@/lib/utils";
import type { MetricTileGroupProps } from "./types";

/**
 * Grupo de métricas: um único contêiner com borda, tiles separados por
 * divisórias. 2 colunas até lg, 4 (ou 3) a partir de lg.
 */
export function MetricTileGroup({ metrics, className, bare = false, actions }: MetricTileGroupProps) {
  const cols = metrics.length >= 4 ? 4 : metrics.length === 3 ? 3 : 2;

  return (
    <div
      className={cn(
        !bare && cn("overflow-hidden border border-border bg-card", radiusClass.card, shadowClass.sm),
        className,
      )}
    >
      <div
        className={cn(
          "grid grid-cols-2",
          cols === 4 && "lg:grid-cols-4",
          cols === 3 && "lg:grid-cols-3",
        )}
      >
        {metrics.map((metric) => (
          <MetricTile
            key={metric.label}
            metric={metric}
            action={actions?.[metric.label]}
            className={cn(
              "border-t border-border [&:nth-child(-n+2)]:border-t-0",
              "border-l [&:nth-child(2n+1)]:border-l-0",
              cols === 4 &&
                "lg:[&:nth-child(2n+1)]:border-l lg:[&:nth-child(4n+1)]:border-l-0 lg:[&:nth-child(n+3)]:border-t-0",
              cols === 3 &&
                "lg:[&:nth-child(2n+1)]:border-l lg:[&:nth-child(3n+1)]:border-l-0 lg:[&:nth-child(n+3)]:border-t-0",
            )}
          />
        ))}
      </div>
    </div>
  );
}
