import { FidelityBadge } from "../FidelityBadge";
import { radiusClass } from "../../tokens/radius";
import { textClass } from "../../tokens/typography";
import { cn } from "@/lib/utils";
import { formatPtNumbers } from "@/lib/format";
import type { MetricTileProps } from "./types";

/** Metric tile group cell: value on top, label, delta. No border of its own. */
export function MetricTile({ metric, className, action }: MetricTileProps) {
  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col justify-center px-4 py-4 sm:h-32 sm:py-0 sm:px-5 2xl:px-8",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className={cn(
            textClass.kpi,
            "min-w-0 whitespace-nowrap text-[20px] leading-[26px] text-foreground 2xl:text-[26px] 2xl:leading-[34px]",
          )}
        >
          {formatPtNumbers(metric.value)}
        </div>
        <span className="mt-1 shrink-0 scale-75 origin-top-right sm:mt-2 sm:scale-100">
          <FidelityBadge fidelity={metric.fidelity} note={metric.fidelityNote} />
        </span>
      </div>

      <div className="mt-1 flex items-center justify-between gap-2 sm:mt-2 sm:gap-3">
        <span className="min-w-0 truncate text-[12px] leading-[16px] text-muted-foreground sm:text-[13px] sm:leading-[18px]">
          {metric.label}
        </span>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className={cn(
              "h-8 shrink-0 bg-primary px-3 text-[13px] font-semibold text-primary-foreground transition-shadow duration-150 hover:shadow-md",
              radiusClass.control,
            )}
          >
            {action.label}
          </button>
        )}
      </div>

      {metric.delta && (
        <div
          className={cn(
            textClass.numeric,
            "mt-1 flex items-center gap-1 whitespace-nowrap text-[12px] leading-[16px] sm:text-[13px] sm:leading-[18px]",
          )}
        >
          <span
            className={cn(
              "font-semibold",
              metric.deltaDirection === "up"
                ? "text-success"
                : metric.deltaDirection === "down"
                  ? "text-destructive"
                  : "text-muted-foreground",
            )}
          >
            {formatPtNumbers(metric.delta)}
          </span>
          <span className="hidden text-muted-foreground sm:inline">vs mês anterior</span>
        </div>
      )}
      {metric.subNote && (
        <div
          className={cn(
            textClass.numeric,
            "mt-1 truncate text-[12px] leading-[16px] text-muted-foreground sm:text-[13px] sm:leading-[18px]",
          )}
        >
          {formatPtNumbers(metric.subNote)}
        </div>
      )}
    </div>
  );
}
