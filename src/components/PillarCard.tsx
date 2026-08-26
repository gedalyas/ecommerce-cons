import { Link } from "@tanstack/react-router";
import { AlertTriangle, Lock } from "lucide-react";
import { KpiTile } from "@/components/KpiTile";
import { RecommendationList } from "@/components/RecommendationList";
import { cn } from "@/lib/utils";
import { statusLabel, type Pillar } from "@/lib/mock-data";

const badgeStyles: Record<Pillar["status"], string> = {
  concluido: "border border-primary text-primary",
  andamento: "border border-border text-foreground",
  "nao-iniciado": "bg-muted text-muted-foreground",
  bloqueado: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status }: { status: Pillar["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.04em]",
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
  const done = pillar.status === "concluido";

  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-card shadow-sm",
        blocked && "bg-muted/40",
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2
          className={cn(
            "t-card-title min-w-0",
            done || blocked ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {pillar.title}
        </h2>
        <StatusBadge status={pillar.status} />
      </header>

      {blocked ? (
        <div className="px-5 py-6 text-[15px] text-muted-foreground">
          Disponível após o marco de maturidade.{" "}
          <Link to="/" className="font-semibold text-primary underline underline-offset-2">
            ver o que falta
          </Link>
        </div>
      ) : (
        <div className="space-y-6 p-5">
          <div
            className={cn(
              "grid gap-4",
              pillar.kpis.length >= 4
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4"
                : pillar.kpis.length === 3
                  ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3"
                  : "grid-cols-1 sm:grid-cols-2",
            )}
          >
            {pillar.kpis.map((kpi) => (
              <KpiTile key={kpi.label} kpi={kpi} className="bg-background shadow-none" />
            ))}
          </div>

          <div>
            <div className="t-label mb-3 text-muted-foreground">Recomendações em aberto</div>
            {pillar.recommendations.length ? (
              <RecommendationList items={pillar.recommendations} />
            ) : (
              <p className="t-meta text-muted-foreground">
                Nenhuma recomendação em aberto. Reveja os indicadores acima para propor a próxima ação.
              </p>
            )}
          </div>
        </div>
      )}

      {!blocked && pillar.dataPending && (
        <footer className="flex items-start gap-2 border-t border-border border-l-[3px] border-l-warning px-5 py-4 t-meta text-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <span>
            <span className="font-semibold">Pendências de dado: </span>
            {pillar.dataPending}
          </span>
        </footer>
      )}
    </section>
  );
}
