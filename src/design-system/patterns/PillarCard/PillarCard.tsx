import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { Card } from "../../primitives/Card";
import { MetricTileGroup } from "../MetricTileGroup";
import { RecommendationList } from "../RecommendationList";
import { StatusBadge } from "../StatusBadge";
import { layout } from "../../tokens/spacing";
import { textClass } from "../../tokens/typography";
import { cn } from "@/lib/utils";
import type { PillarCardProps } from "./types";

/** Pillar card: the single container carrying border, radius and shadow. */
export function PillarCard({ pillar, extraSlot }: PillarCardProps) {
  const blocked = pillar.status === "blocked";
  const done = pillar.status === "done";

  return (
    <Card tone={blocked ? "muted" : "default"}>
      <header
        className={cn("flex flex-wrap items-center justify-between gap-3", layout.cardHeader)}
      >
        <h2
          className={cn(
            textClass.cardTitle,
            "min-w-0",
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
        <div className={cn("space-y-6", layout.cardPadding)}>
          <div className="-mx-5 -mt-5">
            <MetricTileGroup metrics={pillar.kpis} bare />
          </div>

          {extraSlot && <div className="border-t border-border pt-8">{extraSlot}</div>}

          <div className={extraSlot ? "border-t border-border pt-8" : undefined}>
            <div className={cn(textClass.label, "mb-3 text-muted-foreground")}>
              Recomendações em aberto
            </div>
            {pillar.recommendations.length ? (
              <RecommendationList items={pillar.recommendations} />
            ) : (
              <p className={cn(textClass.meta, "text-muted-foreground")}>
                Nenhuma recomendação em aberto. Reveja os indicadores acima para propor a próxima
                ação.
              </p>
            )}
          </div>
        </div>
      )}

      {!blocked && pillar.dataPending && (
        <footer
          className={cn(
            textClass.meta,
            "flex items-start gap-2 border-t border-border border-l-[3px] border-l-warning px-5 py-4 text-foreground",
          )}
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <span>
            <span className="font-semibold">Pendências de dado: </span>
            {pillar.dataPending}
          </span>
        </footer>
      )}
    </Card>
  );
}
