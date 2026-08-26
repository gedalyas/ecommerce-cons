import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, formatPtNumbers } from "@/lib/utils";
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

export function KpiTile({
  kpi,
  className,
  variant = "card",
}: {
  kpi: Kpi;
  className?: string;
  variant?: "card" | "plain";
}) {
  return (
    <div
      className={cn(
        "min-w-0",
        variant === "card" &&
          "rounded-lg border border-border bg-card p-5 shadow-sm transition-shadow duration-150",
        className,
      )}
    >
      <div className="flex h-8 items-start gap-1.5">
        <span className="t-label min-w-0 flex-1 text-muted-foreground">{kpi.label}</span>
        <FidelitySeal kpi={kpi} />
      </div>
      <div className="t-kpi mt-2 text-foreground">
        {formatPtNumbers(kpi.value)
          .split(",")
          .flatMap((part, i) =>
            i === 0
              ? [<span key={i}>{part}</span>]
              : [
                  <span key={`s${i}`} className="mx-[-0.05em] inline-block">
                    ,
                  </span>,
                  <span key={i}>{part}</span>,
                ],
          )}
      </div>

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
          <span>{formatPtNumbers(kpi.delta)}</span>
          <span className="font-normal text-muted-foreground">vs mês anterior</span>
        </div>
      )}
      {kpi.subNote && (
        <div className="num mt-1 text-[13px] text-muted-foreground">
          {formatPtNumbers(kpi.subNote)}
        </div>
      )}
    </div>
  );
}
