import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Kpi } from "@/lib/mock-data";

const sealStyles = {
  A: "bg-primary text-primary-foreground border-primary",
  B: "bg-card text-primary border-primary",
  C: "bg-muted text-muted-foreground border-border",
} as const;

export function FidelitySeal({ kpi }: { kpi: Kpi }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex h-5 w-5 shrink-0 cursor-default items-center justify-center rounded-full border text-[11px] font-semibold leading-none",
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
  const Icon =
    kpi.deltaDirection === "up" ? ArrowUpRight : kpi.deltaDirection === "down" ? ArrowDownRight : Minus;

  return (
    <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {kpi.label}
        </span>
        <FidelitySeal kpi={kpi} />
      </div>
      <div
        className={cn(
          "num mt-3 text-2xl text-foreground",
          kpi.fidelity === "A" ? "font-semibold" : "font-normal",
        )}
      >
        {kpi.value}
      </div>
      {kpi.delta && (
        <div
          className={cn(
            "mt-1.5 flex items-center gap-1 text-xs font-medium",
            kpi.deltaDirection === "up"
              ? "text-success"
              : kpi.deltaDirection === "down"
                ? "text-destructive"
                : "text-muted-foreground",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="num">{kpi.delta}</span>
          <span className="font-normal text-muted-foreground">vs mês anterior</span>
        </div>
      )}
    </div>
  );
}
