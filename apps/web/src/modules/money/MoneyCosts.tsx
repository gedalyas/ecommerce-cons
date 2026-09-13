import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/shared/ui/Button";
import { DataTable, type DataTableColumn } from "@/shared/ui/DataTable";
import { Dialog } from "@/shared/ui/Dialog";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { formatCurrency, formatDate, formatPercent } from "@ecommerce/contracts/shared/format";
import { CostForm } from "./CostForm";
import {
  businessUnitLabel,
  costCategoryLabel,
  costFrequencyLabel,
  percentFrequencies,
  subcategoryLabel,
} from "@ecommerce/contracts/money";
import type { CostRuleRow, CostInput } from "@ecommerce/contracts/money";
import { createCostRule, deleteCostRule, updateCostRule } from "./moneyController";

const valueOf = (r: CostRuleRow) =>
  percentFrequencies.includes(r.frequency) ? formatPercent(r.value, 2) : formatCurrency(r.value, 2);

const day = (iso: string | null) =>
  iso ? formatDate(`${iso}T00:00:00`, { day: "2-digit", month: "2-digit", year: "2-digit" }) : "—";

type Editing =
  | { kind: "new" }
  | { kind: "edit"; rule: CostRuleRow }
  | { kind: "delete"; rule: CostRuleRow }
  | null;

/** The cost registry: the structure that feeds the DRE, margins and profit everywhere. */
export function MoneyCosts({ rules }: { rules: CostRuleRow[] }) {
  const router = useRouter();
  const create = useServerFn(createCostRule);
  const update = useServerFn(updateCostRule);
  const remove = useServerFn(deleteCostRule);
  const [editing, setEditing] = useState<Editing>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      setEditing(null);
      await router.invalidate();
    } catch {
      setError("Não foi possível salvar. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  const submit = (input: CostInput) =>
    run(() =>
      editing?.kind === "edit"
        ? update({ data: { id: editing.rule.id, input } })
        : create({ data: input }),
    );

  const columns: DataTableColumn<CostRuleRow>[] = [
    {
      key: "name",
      header: "Nome",
      render: (r) => r.name,
      sortValue: (r) => r.name,
      className: "font-semibold",
    },
    {
      key: "description",
      header: "Descrição",
      render: (r) => r.description || "—",
      csv: (r) => r.description,
    },
    {
      key: "startDate",
      header: "Início",
      render: (r) => day(r.startDate),
      csv: (r) => r.startDate,
      sortValue: (r) => r.startDate,
      className: "whitespace-nowrap",
    },
    {
      key: "endDate",
      header: "Fim",
      render: (r) => day(r.endDate),
      csv: (r) => r.endDate,
      sortValue: (r) => r.endDate,
      className: "whitespace-nowrap",
    },
    {
      key: "businessUnit",
      header: "Canal",
      render: (r) => businessUnitLabel[r.businessUnit],
      csv: (r) => businessUnitLabel[r.businessUnit],
    },
    {
      key: "category",
      header: "Categoria",
      render: (r) => costCategoryLabel[r.category],
      csv: (r) => costCategoryLabel[r.category],
      sortValue: (r) => r.category,
    },
    {
      key: "subcategory",
      header: "Subcategoria",
      render: (r) => subcategoryLabel(r.category, r.subcategory),
      csv: (r) => subcategoryLabel(r.category, r.subcategory),
    },
    {
      key: "frequency",
      header: "Frequência",
      render: (r) => costFrequencyLabel[r.frequency],
      csv: (r) => costFrequencyLabel[r.frequency],
      className: "whitespace-nowrap",
    },
    {
      key: "value",
      header: "Valor",
      align: "right",
      render: (r) => valueOf(r),
      csv: (r) => r.value,
      sortValue: (r) => r.value,
      className: "whitespace-nowrap",
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <span className="inline-flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Editar ${r.name}`}
            onClick={() => setEditing({ kind: "edit", rule: r })}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Excluir ${r.name}`}
            onClick={() => setEditing({ kind: "delete", rule: r })}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </span>
      ),
      csv: () => null,
    },
  ];

  return (
    <>
      <SectionBlock
        title="Custos e despesas"
        description="As regras abaixo alimentam a DRE, as margens e o lucro em todas as telas. Frequências percentuais se aplicam sobre a receita ou sobre o gasto em ads."
        meta={
          <Button size="sm" onClick={() => setEditing({ kind: "new" })}>
            <Plus className="h-4 w-4" aria-hidden />
            Adicionar custo ou despesa
          </Button>
        }
      >
        <DataTable
          columns={columns}
          rows={rules}
          rowKey={(r) => r.id}
          initialSort={{ key: "category", direction: "asc" }}
          initialPageSize={20}
          csvFileName="custos-e-despesas"
          emptyMessage="Nenhum custo cadastrado. Adicione o primeiro para liberar margem, lucro e DRE."
        />
      </SectionBlock>

      <Dialog
        open={editing?.kind === "new" || editing?.kind === "edit"}
        onOpenChange={(open) => !open && !busy && setEditing(null)}
        title={editing?.kind === "edit" ? "Editar custo ou despesa" : "Adicionar custo ou despesa"}
        description="Nome, unidade de negócio, categoria, frequência, valor e vigência."
      >
        {(editing?.kind === "new" || editing?.kind === "edit") && (
          <>
            <CostForm
              rule={editing.kind === "edit" ? editing.rule : null}
              onSubmit={submit}
              onCancel={() => setEditing(null)}
              submitting={busy}
            />
            {error && <p className="mt-3 text-[13px] leading-[18px] text-destructive">{error}</p>}
          </>
        )}
      </Dialog>

      <Dialog
        open={editing?.kind === "delete"}
        onOpenChange={(open) => !open && !busy && setEditing(null)}
        title="Excluir custo ou despesa?"
        description={
          editing?.kind === "delete"
            ? `"${editing.rule.name}" deixa de entrar na DRE e nas margens a partir de agora.`
            : undefined
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() =>
              editing?.kind === "delete" &&
              void run(() => remove({ data: { id: editing.rule.id } }))
            }
          >
            {busy ? "Excluindo…" : "Excluir"}
          </Button>
        </div>
        {error && <p className="mt-3 text-[13px] leading-[18px] text-destructive">{error}</p>}
      </Dialog>
    </>
  );
}
