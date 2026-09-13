import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { InfluencerStatus } from "@/generated/prisma/enums";
import { Button } from "@/shared/ui/Button";
import { DataTable } from "@/shared/ui/DataTable";
import { Dialog } from "@/shared/ui/Dialog";
import { Input } from "@/shared/ui/Input";
import { PageHeader } from "@/shared/ui/PageHeader";
import { PeriodSelector } from "@/shared/ui/PeriodSelector";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { TabBar } from "@/shared/ui/TabBar";
import { usePeriod } from "@/shared/hooks/usePeriod";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { formatPeriodLabel } from "@/shared/utils/format";
import type { PeriodSearch } from "@/shared/utils/period";
import { InfluencerForm } from "./InfluencerForm";
import { influencerColumns } from "./influencerColumns";
import {
  influencerStatusLabel,
  type Influencer,
  type InfluencerRow,
  type InfluencersScreen,
} from "./influencers.types";
import {
  createInfluencerFn,
  deleteInfluencerFn,
  updateInfluencerFn,
} from "./influencersController";
import type { InfluencerParsed, InfluencersSearch } from "./influencersSchema";

type Editing =
  | { kind: "new" }
  | { kind: "edit"; influencer: Influencer }
  | { kind: "delete"; influencer: Influencer }
  | null;

function useInfluencersSearch() {
  const search = useSearch({ from: "/influenciadores" }) as PeriodSearch & InfluencersSearch;
  const navigate = useNavigate();
  const patch = (next: Partial<InfluencersSearch>) =>
    void navigate({
      to: "/influenciadores",
      search: (prev: Record<string, unknown>) => ({ ...prev, ...next }),
      replace: true,
    });
  return { search, patch };
}

function useInfluencerActions() {
  const router = useRouter();
  const create = useServerFn(createInfluencerFn);
  const update = useServerFn(updateInfluencerFn);
  const remove = useServerFn(deleteInfluencerFn);
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

  const submit = (input: InfluencerParsed) =>
    run(() =>
      editing?.kind === "edit"
        ? update({ data: { id: editing.influencer.id, input } })
        : create({ data: input }),
    );
  const confirmDelete = () =>
    editing?.kind === "delete"
      ? run(() => remove({ data: { id: editing.influencer.id } }))
      : Promise.resolve();

  return { editing, setEditing, busy, error, submit, confirmDelete };
}

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState(value);
  useEffect(() => setQuery(value), [value]);
  return (
    <Input
      type="search"
      value={query}
      placeholder="Buscar por nome ou identificador"
      aria-label="Buscar influenciador"
      className="w-full sm:w-72"
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onChange(query)}
      onBlur={() => onChange(query)}
    />
  );
}

export function Influencers({ data }: { data: InfluencersScreen }) {
  const { period, setPeriod } = usePeriod();
  const { search, patch } = useInfluencersSearch();
  const { editing, setEditing, busy, error, submit, confirmDelete } = useInfluencerActions();
  const tabs = Object.values(InfluencerStatus).map((status) => ({
    key: status,
    label: `${influencerStatusLabel[status]} (${data.counts[status]})`,
  }));
  const columns = influencerColumns({
    onEdit: (r: InfluencerRow) => setEditing({ kind: "edit", influencer: r }),
    onDelete: (r: InfluencerRow) => setEditing({ kind: "delete", influencer: r }),
  });

  return (
    <div className={layout.page}>
      <PageHeader
        title="Influenciadores"
        subtitle={`Parcerias, remuneração e o retorno de cada cupom em ${formatPeriodLabel(period.inicio, period.fim)} · Loja Aurora`}
      />

      <div className={cn(layout.headerGap, layout.blockStack)}>
        <div className="flex flex-wrap items-center gap-2">
          <PeriodSelector value={period} onChange={setPeriod} />
          <SearchBox value={search.busca} onChange={(busca) => patch({ busca })} />
          <Button className="ml-auto" onClick={() => setEditing({ kind: "new" })}>
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>

        <TabBar tabs={tabs} value={search.status} onChange={(status) => patch({ status })} />

        <SectionBlock
          title="Hub de influenciadores"
          description="Receita e clientes vêm dos pedidos pagos com os cupons da parceria dentro da vigência; o custo aplica as regras de remuneração sobre o período."
        >
          <DataTable
            columns={columns}
            rows={data.rows}
            totalRow={{
              ...data.totals,
              id: "total",
              name: "Total",
              handle: "",
              status: search.status,
              notes: "",
              rules: [],
              coupons: [],
            }}
            rowKey={(r) => r.id}
            initialSort={{ key: "revenue", direction: "desc" }}
            csvFileName={`influenciadores-${period.inicio}-${period.fim}`}
            emptyMessage="Nenhum influenciador neste status."
          />
        </SectionBlock>
      </div>

      <Dialog
        open={editing?.kind === "new" || editing?.kind === "edit"}
        onOpenChange={(open) => !open && !busy && setEditing(null)}
        title={editing?.kind === "edit" ? "Editar influenciador" : "Adicionar influenciador"}
        description={error ?? undefined}
      >
        {(editing?.kind === "new" || editing?.kind === "edit") && (
          <InfluencerForm
            influencer={editing.kind === "edit" ? editing.influencer : null}
            onSubmit={submit}
            onCancel={() => setEditing(null)}
            submitting={busy}
          />
        )}
      </Dialog>

      <Dialog
        open={editing?.kind === "delete"}
        onOpenChange={(open) => !open && !busy && setEditing(null)}
        title="Excluir influenciador?"
        description={
          editing?.kind === "delete"
            ? `${editing.influencer.name} e seus cupons deixam de existir. Os pedidos não são afetados.`
            : undefined
        }
      >
        {error && <p className={cn(textClass.meta, "text-destructive")}>{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => void confirmDelete()} disabled={busy}>
            {busy ? "Excluindo…" : "Excluir"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
