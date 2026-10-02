import { useBlocker, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { Input } from "@/shared/ui/Input";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { formatDate } from "@ecommerce/contracts/shared/format";
import { formatMetric } from "@ecommerce/contracts/shared/metricFormat";
import {
  deriveGoal,
  goalDefinitions,
  goalDerivedKeys,
  goalInputKeys,
  goalInputLabel,
  type GoalInputKey,
  type GoalMonth,
  type GoalsPlanning,
} from "@ecommerce/contracts/goals";
import { saveGoalPlan, suggestGoalPlan } from "./goalsController";
import type { GoalsSearch } from "@ecommerce/contracts/goals";

const emptyMonth = (month: number): GoalMonth => ({
  month,
  totalSold: 0,
  averageTicket: 0,
  conversionRate: 0,
  paidTraffic: 0,
  otherMarketing: 0,
  repurchaseRate: 0,
});

const twelve = (months: GoalMonth[]) => {
  const have = new Map(months.map((m) => [m.month, m]));
  return Array.from({ length: 12 }, (_, i) => have.get(i + 1) ?? emptyMonth(i + 1));
};

const isFilled = (m: GoalMonth) => goalInputKeys.some((k) => m[k] > 0);

const monthLabel = (year: number, month: number) =>
  formatDate(`${year}-${String(month).padStart(2, "0")}-01T00:00:00`, { month: "short" });

const derivedLabel = new Map(goalDefinitions.map((d) => [d.key, d]));

export function GoalsPlan({
  data,
  onPatch,
}: {
  data: GoalsPlanning;
  onPatch: (next: Partial<GoalsSearch>) => void;
}) {
  const router = useRouter();
  const save = useServerFn(saveGoalPlan);
  const suggest = useServerFn(suggestGoalPlan);
  const [months, setMonths] = useState<GoalMonth[]>(() => twelve(data.months));
  const [saved, setSaved] = useState<string>(() => JSON.stringify(twelve(data.months)));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next = twelve(data.months);
    setMonths(next);
    setSaved(JSON.stringify(next));
  }, [data.year, data.months]);

  const dirty = JSON.stringify(months) !== saved;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const blocker = useBlocker({
    shouldBlockFn: () => dirty && !busy,
    withResolver: true,
    enableBeforeUnload: false,
  });

  const derived = useMemo(() => months.map((m) => deriveGoal(m)), [months]);

  const setValue = (month: number, key: GoalInputKey, raw: string) => {
    const value = raw === "" ? 0 : Number(raw);
    if (Number.isNaN(value) || value < 0) return;
    setMonths((prev) => prev.map((m) => (m.month === month ? { ...m, [key]: value } : m)));
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch {
      setError("Não foi possível concluir. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  const onSave = () =>
    run(async () => {
      const filled = months.filter(isFilled);
      await save({ data: { year: data.year, months: filled } });
      setSaved(JSON.stringify(twelve(filled)));
      await router.invalidate();
    });

  const onSuggest = () =>
    run(async () => {
      const suggested = await suggest();
      if (suggested.length === 0) {
        setError("Sem vendas nos últimos 12 meses para sugerir um plano.");
        return;
      }
      setMonths(twelve(suggested));
    });

  return (
    <>
      <SectionBlock
        title={`Planejamento ${data.year}`}
        description="Informe os seis direcionadores de cada mês; pedidos, sessões, ROAS, investimento total, ROI, CPA, novos clientes e CAC são derivados."
        meta={
          <SegmentedControl
            label="Ano"
            options={data.years.map((y) => ({ key: String(y), label: String(y) }))}
            value={String(data.year)}
            onChange={(y) => onPatch({ ano: Number(y) })}
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th
                  className={cn(
                    textClass.label,
                    "sticky left-0 bg-card px-5 py-3 text-left text-muted-foreground",
                  )}
                >
                  Métrica
                </th>
                {months.map((m) => (
                  <th
                    key={m.month}
                    className={cn(
                      textClass.label,
                      "px-2 py-3 text-right capitalize text-muted-foreground",
                    )}
                  >
                    {monthLabel(data.year, m.month)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {goalInputKeys.map((key) => (
                <tr key={key} className="border-b border-border">
                  <th
                    scope="row"
                    className={cn(
                      textClass.body,
                      "sticky left-0 whitespace-nowrap bg-card px-5 py-2 text-left font-semibold max-md:max-w-52 max-md:truncate",
                    )}
                  >
                    {goalInputLabel[key].label}
                    <span className={cn(textClass.meta, "ml-1 font-normal text-muted-foreground")}>
                      {goalInputLabel[key].unit === "percent" ? "%" : "R$"}
                    </span>
                  </th>
                  {months.map((m) => (
                    <td key={m.month} className="px-1 py-1">
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={goalInputLabel[key].unit === "percent" ? "0.1" : "1"}
                        aria-label={`${goalInputLabel[key].label} · ${monthLabel(data.year, m.month)}`}
                        className={cn(textClass.numeric, "h-8 min-w-20 px-2 text-right")}
                        value={m[key] === 0 ? "" : String(m[key])}
                        onChange={(e) => setValue(m.month, key, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
              {goalDerivedKeys.map((key) => {
                const d = derivedLabel.get(key)!;
                return (
                  <tr key={key} className="border-b border-border bg-muted/40">
                    <th
                      scope="row"
                      className={cn(
                        textClass.body,
                        "sticky left-0 whitespace-nowrap bg-muted px-5 py-2 text-left text-muted-foreground max-md:max-w-52 max-md:truncate",
                      )}
                    >
                      {d.label}
                    </th>
                    {months.map((m, i) => (
                      <td
                        key={m.month}
                        className={cn(
                          textClass.body,
                          textClass.numeric,
                          "whitespace-nowrap px-2 py-2 text-right text-muted-foreground",
                        )}
                      >
                        {isFilled(m) ? formatMetric(derived[i]![key], d.unit) : "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className={cn(textClass.meta, "text-muted-foreground")}>
            {error ?? (dirty ? "Alterações não salvas." : "Tudo salvo.")}
          </div>
          <div className="flex flex-wrap gap-2 max-sm:w-full">
            <Button
              variant="outline"
              className="max-sm:flex-1"
              onClick={() => void onSuggest()}
              disabled={busy}
            >
              Preencher com o histórico (+10%)
            </Button>
            <Button
              className="max-sm:flex-1"
              onClick={() => void onSave()}
              disabled={busy || !dirty}
            >
              {busy ? "Salvando…" : "Salvar plano"}
            </Button>
          </div>
        </div>
      </SectionBlock>

      <Dialog
        open={blocker.status === "blocked"}
        onOpenChange={(open) => {
          if (!open && blocker.status === "blocked") blocker.reset();
        }}
        title="Descartar alterações não salvas?"
        description="Você editou o plano e ainda não salvou. Ao sair, as alterações serão perdidas."
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => blocker.status === "blocked" && blocker.reset()}>
            Continuar editando
          </Button>
          <Button
            variant="destructive"
            onClick={() => blocker.status === "blocked" && blocker.proceed()}
          >
            Descartar
          </Button>
        </div>
      </Dialog>
    </>
  );
}
