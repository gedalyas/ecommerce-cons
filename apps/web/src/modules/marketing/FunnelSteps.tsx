import type { FunnelStepDelta } from "@ecommerce/contracts/marketing";
import { formatNumber, formatPercent, formatVariation } from "@ecommerce/contracts/shared/format";
import { metricValue } from "@ecommerce/contracts/shared/metricValue";
import { radiusClass } from "@/shared/styles/radius";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";

function StepDelta({ step }: { step: FunnelStepDelta }) {
  const variation = metricValue("count", step.value, step.previous).variation;
  if (variation == null) return null;
  return (
    <span className={cn(variation >= 0 ? "text-success" : "text-destructive", "font-semibold")}>
      {formatVariation(variation)}
    </span>
  );
}

export function FunnelSteps({ steps }: { steps: FunnelStepDelta[] }) {
  const top = steps[0]?.value ?? 0;
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step) => (
        <li key={step.key} className="flex flex-col gap-1">
          <div className={cn(textClass.meta, "flex items-baseline justify-between gap-3")}>
            <span className="text-foreground">{step.label}</span>
            <span
              className={cn(textClass.numeric, "flex items-baseline gap-2 text-muted-foreground")}
            >
              {step.fromPrevious != null && (
                <span>{formatPercent(step.fromPrevious)} da etapa anterior</span>
              )}
              <StepDelta step={step} />
              <span className="font-semibold text-foreground">{formatNumber(step.value)}</span>
            </span>
          </div>
          <div className={cn("h-2 w-full bg-muted", radiusClass.badge)}>
            <div
              className={cn("h-2 bg-primary", radiusClass.badge)}
              style={{ width: `${top > 0 ? Math.max((step.value / top) * 100, 1) : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
