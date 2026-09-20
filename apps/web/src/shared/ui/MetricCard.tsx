import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { radiusClass } from "@/shared/styles/radius";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { formatPtNumbers } from "@ecommerce/contracts/shared/format";
import type { MetricTileProps } from "./metricTile.types";

const deltaTone = {
  up: "bg-success-soft text-success",
  down: "bg-destructive-soft text-destructive",
  neutral: "bg-muted text-muted-foreground",
} as const;

const deltaIconOf = (delta: string) =>
  /^[-−]/.test(delta) ? ArrowDownRight : delta.startsWith("+") ? ArrowUpRight : Minus;

export function MetricCard({
  metric,
  action,
  nested = false,
  className,
}: MetricTileProps & { nested?: boolean }) {
  const tone = deltaTone[metric.deltaDirection ?? "neutral"];
  const DeltaIcon = deltaIconOf(metric.delta ?? "");
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-2 p-4",
        radiusClass.card,
        nested ? "bg-muted/40" : "border border-border bg-card",
        className,
      )}
    >
      <div className={cn(textClass.meta, "line-clamp-2 text-muted-foreground")}>{metric.label}</div>
      <div
        className={cn(textClass.kpi, "min-w-0 truncate text-[24px] leading-[30px] text-foreground")}
      >
        {formatPtNumbers(metric.value)}
      </div>
      {(metric.delta || metric.subNote) && (
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {metric.delta && (
            <span
              className={cn(
                textClass.numeric,
                "inline-flex h-6 items-center gap-0.5 px-1.5 text-[12px] font-semibold",
                radiusClass.badge,
                tone,
              )}
              aria-label={`${formatPtNumbers(metric.delta)} ${metric.deltaLabel ?? "vs mês anterior"}`}
            >
              <DeltaIcon className="h-3.5 w-3.5" aria-hidden />
              {formatPtNumbers(metric.delta)}
            </span>
          )}
          {metric.subNote && (
            <span
              className={cn(
                textClass.numeric,
                "min-w-0 truncate text-[12px] text-muted-foreground",
              )}
            >
              {formatPtNumbers(metric.subNote)}
            </span>
          )}
        </div>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={cn(
            "mt-1 h-8 self-start bg-primary px-3 text-[13px] font-semibold text-primary-foreground",
            radiusClass.control,
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
