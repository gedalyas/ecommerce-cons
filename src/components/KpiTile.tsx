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

function KpiValue({ value }: { value: string }) {
  return <>{formatPtNumbers(value)}</>;
}

export function KpiTile({
  kpi,
  className,
  action,
}: {
  kpi: Kpi;
  className?: string;
  /** Ação secundária opcional, alinhada à direita na linha do rótulo. */
  action?: { label: string; onClick?: () => void } | undefined;
}) {
  return (
    <div
      className={cn(
        "relative flex min-w-0 flex-col justify-center px-4 py-4 sm:h-32 sm:px-8 sm:py-0",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="t-kpi min-w-0 whitespace-nowrap text-[20px] leading-[26px] text-foreground sm:text-[32px] sm:leading-[40px]">
          <KpiValue value={kpi.value} />
        </div>
        <span className="mt-1 scale-75 origin-top-right sm:mt-2 sm:scale-100">
          <FidelitySeal kpi={kpi} />
        </span>
      </div>

      <div className="mt-1 flex items-center justify-between gap-2 sm:mt-2 sm:gap-3">
        <span className="min-w-0 truncate text-[12px] leading-[16px] text-muted-foreground sm:text-[13px] sm:leading-[18px]">
          {kpi.label}
        </span>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="h-8 shrink-0 rounded-md bg-primary px-3 text-[13px] font-semibold text-primary-foreground transition-shadow duration-150 hover:shadow-md"
          >
            {action.label}
          </button>
        )}
      </div>

      {kpi.delta && (
        <div className="num mt-1 flex items-center gap-1 whitespace-nowrap text-[12px] leading-[16px] sm:text-[13px] sm:leading-[18px]">
          <span
            className={cn(
              "font-semibold",
              kpi.deltaDirection === "up"
                ? "text-success"
                : kpi.deltaDirection === "down"
                  ? "text-destructive"
                  : "text-muted-foreground",
            )}
          >
            {formatPtNumbers(kpi.delta)}
          </span>
          <span className="hidden text-muted-foreground sm:inline">vs mês anterior</span>
        </div>
      )}
      {kpi.subNote && (
        <div className="num mt-1 truncate text-[12px] leading-[16px] text-muted-foreground sm:text-[13px] sm:leading-[18px]">
          {formatPtNumbers(kpi.subNote)}
        </div>
      )}
    </div>
  );
}

/** Grupo de métricas: um único contêiner com borda, tiles separados por divisórias. */
export function KpiGroup({
  kpis,
  className,
  bare = false,
  actions,
}: {
  kpis: Kpi[];
  className?: string;
  /** Sem borda/fundo próprios (quando já está dentro de outro card). */
  bare?: boolean;
  actions?: Record<string, { label: string; onClick?: () => void }>;
}) {
  const cols = kpis.length >= 4 ? 4 : kpis.length === 3 ? 3 : 2;

  return (
    <div
      className={cn(
        "grid grid-cols-2",
        cols === 4 && "lg:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4",
        cols === 3 && "lg:grid-cols-3",
        !bare && "overflow-hidden rounded-lg border border-border bg-card shadow-sm",
        className,
      )}
    >
      {kpis.map((kpi) => (
        <KpiTile
          key={kpi.label}
          kpi={kpi}
          action={actions?.[kpi.label]}
          className={cn(
            "border-t border-border [&:nth-child(-n+2)]:border-t-0",
            "border-l [&:nth-child(2n+1)]:border-l-0",
            cols === 4 &&
              "lg:[&:nth-child(2n+1)]:border-l lg:[&:nth-child(4n+1)]:border-l-0 lg:[&:nth-child(n+3)]:border-t-0 xl:[&:nth-child(2n+1)]:border-l-0 xl:[&:nth-child(n+3)]:border-t 2xl:[&:nth-child(2n+1)]:border-l 2xl:[&:nth-child(4n+1)]:border-l-0 2xl:[&:nth-child(n+3)]:border-t-0",
            cols === 3 &&
              "lg:[&:nth-child(2n+1)]:border-l lg:[&:nth-child(3n+1)]:border-l-0 lg:[&:nth-child(n+3)]:border-t-0",
          )}
        />
      ))}
    </div>
  );
}
