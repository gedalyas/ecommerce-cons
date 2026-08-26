import { Link } from "@tanstack/react-router";
import { AlertTriangle, Lock } from "lucide-react";
import { KpiTile } from "@/components/KpiTile";
import { RecommendationList } from "@/components/RecommendationList";
import { PresencaCriativos } from "@/components/PresencaCriativos";
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
        "inline-flex h-[22px] items-center gap-1 rounded-sm px-2.5 py-1 text-[11px] font-semibold uppercase leading-none tracking-[0.04em]",
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
          {(() => {
            const cols = pillar.kpis.length >= 4 ? 4 : pillar.kpis.length === 3 ? 3 : 2;
            return (
              <div
                className={cn(
                  "grid grid-cols-1 gap-0 sm:grid-cols-2",
                  cols === 4 && "lg:grid-cols-4",
                  cols === 3 && "lg:grid-cols-3",
                )}
              >
                {pillar.kpis.map((kpi) => (
                  <KpiTile
                    key={kpi.label}
                    kpi={kpi}
                    variant="plain"
                    className={cn(
                      // mobile: divisória horizontal
                      "border-t border-border py-4 first:border-t-0 first:pt-0",
                      // sm: 2 colunas, divisória vertical
                      "sm:border-t-0 sm:border-l sm:py-0 sm:pl-6 sm:pr-6 sm:first:pt-0",
                      "sm:[&:nth-child(2n+1)]:border-l-0 sm:[&:nth-child(2n+1)]:pl-0",
                      "sm:[&:nth-child(n+3)]:mt-6 sm:[&:nth-child(n+3)]:border-t sm:[&:nth-child(n+3)]:pt-6",
                      cols === 4 &&
                        "lg:[&:nth-child(2n+1)]:border-l lg:[&:nth-child(2n+1)]:pl-6 lg:[&:nth-child(4n+1)]:border-l-0 lg:[&:nth-child(4n+1)]:pl-0 lg:[&:nth-child(n+3)]:mt-0 lg:[&:nth-child(n+3)]:border-t-0 lg:[&:nth-child(n+3)]:pt-0",
                      cols === 3 &&
                        "lg:[&:nth-child(2n+1)]:border-l lg:[&:nth-child(2n+1)]:pl-6 lg:[&:nth-child(3n+1)]:border-l-0 lg:[&:nth-child(3n+1)]:pl-0 lg:[&:nth-child(n+3)]:mt-0 lg:[&:nth-child(n+3)]:border-t-0 lg:[&:nth-child(n+3)]:pt-0",
                    )}
                  />
                ))}
              </div>
            );
          })()}


          {pillar.extra === "presenca-criativos" && (
            <div className="border-t border-border pt-8">
              <PresencaCriativos />
            </div>
          )}

          <div className={pillar.extra ? "border-t border-border pt-8" : undefined}>
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
