import { cn } from "@/shared/utils/cn";
import { formatVariation } from "@ecommerce/contracts/shared/format";
import { formatMetric } from "@ecommerce/contracts/shared/metricFormat";
import { radiusClass } from "@/shared/styles/radius";
import { textClass } from "@/shared/styles/typography";
import type { IndicatorCarouselProps } from "./indicatorCarousel.types";

export type { IndicatorCarouselProps, IndicatorItem } from "./indicatorCarousel.types";

/**
 * Horizontal row of indicator chips. The selected chip drives whatever sits
 * below it (typically a big number and its time series).
 */
export function IndicatorCarousel({
  items,
  selected,
  onSelect,
  className,
}: IndicatorCarouselProps) {
  return (
    <div
      role="tablist"
      aria-label="Indicadores"
      className={cn(
        "-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.key === selected;
        const v = item.metric.variation;
        const good = v == null ? null : v > 0 === ((item.goodWhen ?? "up") === "up");
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(item.key)}
            className={cn(
              "flex min-w-[148px] shrink-0 snap-start flex-col items-start gap-1 border px-4 py-3 text-left transition-colors duration-150",
              radiusClass.card,
              active
                ? "border-primary bg-success-soft"
                : "border-border bg-card hover:border-border-strong",
            )}
          >
            <span className={cn(textClass.meta, "text-muted-foreground")}>{item.label}</span>
            <span
              className={cn(
                textClass.numeric,
                "text-[17px] font-semibold leading-6 text-foreground",
              )}
            >
              {formatMetric(item.metric.value, item.metric.unit)}
            </span>
            {v != null && (
              <span
                className={cn(
                  textClass.numeric,
                  "text-[12px] leading-4 font-semibold",
                  Math.abs(v) < 0.05
                    ? "text-muted-foreground"
                    : good
                      ? "text-success"
                      : "text-destructive",
                )}
              >
                {formatVariation(v)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
