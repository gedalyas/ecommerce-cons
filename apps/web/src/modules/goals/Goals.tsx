import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";
import { PageHeader } from "@/shared/ui/PageHeader";
import { PeriodSelector } from "@/shared/ui/PeriodSelector";
import { TabBar } from "@/shared/ui/TabBar";
import { usePeriod } from "@/shared/hooks/usePeriod";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { formatPeriodLabel } from "@ecommerce/contracts/shared/format";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import type { GoalsScreen, GoalsSearch } from "@ecommerce/contracts/goals";
import { GoalsPlan } from "./GoalsPlan";
import { GoalsSummary } from "./GoalsSummary";

const tabs = [
  { key: "resumo", label: "Resumo" },
  { key: "planejamento", label: "Planejamento" },
] as const;

function useGoalsSearch() {
  const search = useSearch({ from: "/metas" }) as PeriodSearch & GoalsSearch;
  const navigate = useNavigate();
  const patch = useCallback(
    (next: Partial<GoalsSearch>) => {
      void navigate({
        to: "/metas",
        search: (prev: Record<string, unknown>) => ({ ...prev, ...next }),
        replace: true,
      });
    },
    [navigate],
  );
  return { search, patch };
}

export function Goals({ data }: { data: GoalsScreen }) {
  const { period, setPeriod } = usePeriod();
  const { search, patch } = useGoalsSearch();

  return (
    <div className={layout.page}>
      <PageHeader
        title="Metas"
        subtitle={
          data.aba === "resumo"
            ? `Realizado × meta em ${formatPeriodLabel(data.summary.window.inicio, data.summary.window.fim)} · Loja Aurora`
            : "Seis direcionadores por mês, oito métricas derivadas · Loja Aurora"
        }
      />

      <div className={cn(layout.headerGap, layout.blockStack)}>
        {data.aba === "resumo" && (
          <div className="flex flex-wrap items-center gap-3">
            <PeriodSelector value={period} onChange={setPeriod} />
            <label className={cn(textClass.meta, "flex items-center gap-2 text-muted-foreground")}>
              <input
                type="checkbox"
                className="accent-primary"
                checked={search.acumulado}
                onChange={(e) => patch({ acumulado: e.target.checked })}
              />
              Acumulado no ano
            </label>
          </div>
        )}

        <TabBar tabs={tabs} value={data.aba} onChange={(aba) => patch({ aba })} />

        {data.aba === "resumo" && <GoalsSummary data={data.summary} />}
        {data.aba === "planejamento" && <GoalsPlan data={data.planning} onPatch={patch} />}
      </div>
    </div>
  );
}
