import { Link } from "@tanstack/react-router";
import { AlertCircle, Lock } from "lucide-react";
import { KpiTile } from "@/components/KpiTile";
import { RecommendationList } from "@/components/RecommendationList";
import { cn } from "@/lib/utils";
import { statusLabel, type Pillar } from "@/lib/mock-data";

const badgeStyles: Record<Pillar["status"], string> = {
  concluido: "border-success/30 bg-success-soft text-success",
  andamento: "border-info/30 bg-info-soft text-info",
  "nao-iniciado": "border-border bg-muted text-muted-foreground",
  bloqueado: "border-border bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: Pillar["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        badgeStyles[status],
      )}
    >
      {status === "bloqueado" && <Lock className="h-3 w-3" />}
      {statusLabel[status]}
    </span>
  );
}

export function PillarCard({ pillar }: { pillar: Pillar }) {
  const blocked = pillar.status === "bloqueado";

  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-card",
        blocked && "bg-muted/40 opacity-70",
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
        <h2 className="text-sm font-semibold text-foreground">{pillar.title}</h2>
        <StatusBadge status={pillar.status} />
      </header>

      {blocked ? (
        <div className="px-4 py-6 text-sm text-muted-foreground sm:px-5">
          Disponível após o marco de maturidade.{" "}
          <Link to="/" className="font-medium text-primary underline underline-offset-2">
            ver o que falta
          </Link>
        </div>
      ) : (
        <div className="space-y-5 p-4 sm:p-5">
          <div
            className={cn(
              "grid gap-3",
              pillar.kpis.length >= 4
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4"
                : pillar.kpis.length === 3
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3"
                  : "grid-cols-1 sm:grid-cols-2",
            )}
          >
            {pillar.kpis.map((kpi) => (
              <KpiTile key={kpi.label} kpi={kpi} className="bg-background" />
            ))}
          </div>

          <div>
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Recomendações em aberto
            </div>
            {pillar.recommendations.length ? (
              <RecommendationList items={pillar.recommendations} />
            ) : (
              <p className="text-xs text-muted-foreground">Nenhuma recomendação em aberto.</p>
            )}
          </div>
        </div>
      )}

      {!blocked && pillar.dataPending && (
        <footer className="flex items-start gap-2 border-t border-border bg-warning-soft/60 px-4 py-3 text-xs text-foreground sm:px-5">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          <span>
            <span className="font-medium">Pendências de dado: </span>
            {pillar.dataPending}
          </span>
        </footer>
      )}
    </section>
  );
}
