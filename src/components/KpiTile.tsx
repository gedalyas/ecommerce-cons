import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Kpi } from "@/lib/mock-data";

const sealStyles = {
  A: "bg-primary text-primary-foreground",
  B: "border border-primary text-primary",
  C: "bg-muted text-[#9ca3af]",
} as const;

export function FidelitySeal({ kpi }: { kpi: Kpi }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "inline-flex h-4 w-4 shrink-0 cursor-default items-center justify-center rounded-sm text-[10px] font-semibold leading-none",
            sealStyles[kpi.fidelity],
          )}
        >
          {kpi.fidelity}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">{kpi.fidelityNote}</TooltipContent>
    </Tooltip>
  );
}

export function KpiTile({ kpi, className }: { kpi: Kpi; className?: string }) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border border-border bg-card p-5 shadow-sm transition-shadow duration-150",
        className,
      )}
    >
      <div className="flex h-8 items-start gap-1.5">
        <span className="t-label min-w-0 flex-1 text-muted-foreground">{kpi.label}</span>
        <FidelitySeal kpi={kpi} />
      </div>
      <div className="t-kpi mt-3 text-foreground">{kpi.value}</div>
      {kpi.delta && (
        <div
          className={cn(
            "num mt-2 flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold",
            kpi.deltaDirection === "up"
              ? "text-success"
              : kpi.deltaDirection === "down"
                ? "text-destructive"
                : "text-muted-foreground",
          )}
        >
          <span>{kpi.delta}</span>
          <span className="font-normal text-muted-foreground">vs mês anterior</span>
        </div>
      )}
    </div>
  );
}
