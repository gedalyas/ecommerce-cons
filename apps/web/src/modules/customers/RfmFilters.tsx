import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { cn } from "@/shared/utils/cn";
import { formatCurrency } from "@ecommerce/contracts/shared/format";
import { textClass } from "@/shared/styles/typography";
import type { RfmFilterOptions } from "@ecommerce/contracts/customers";
import {
  defaultCustomersSearch,
  inactivityBands,
  type CustomersSearch,
  type InactivityBand,
} from "@ecommerce/contracts/customers";

const bandLabel: Record<InactivityBand, string> = {
  "0-30": "até 30 dias",
  "31-60": "31 a 60 dias",
  "61-90": "61 a 90 dias",
  "91-180": "91 a 180 dias",
  "181+": "mais de 180 dias",
};

function DateRange({
  label,
  from,
  to,
  onChange,
}: {
  label: string;
  from: string | null;
  to: string | null;
  onChange: (from: string | null, to: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={cn(textClass.meta, "w-36 text-muted-foreground")}>{label}</span>
      <Input
        type="date"
        value={from ?? ""}
        onChange={(e) => onChange(e.target.value || null, to)}
        className="h-9 w-40 shadow-none"
        aria-label={`${label} — de`}
      />
      <span className={cn(textClass.meta, "text-muted-foreground")}>até</span>
      <Input
        type="date"
        value={to ?? ""}
        onChange={(e) => onChange(from, e.target.value || null)}
        className="h-9 w-40 shadow-none"
        aria-label={`${label} — até`}
      />
    </div>
  );
}

function NumberRange({
  label,
  hint,
  min,
  max,
  onCommit,
}: {
  label: string;
  hint: string;
  min: number | null;
  max: number | null;
  onCommit: (min: number | null, max: number | null) => void;
}) {
  const [draftMin, setDraftMin] = useState(min?.toString() ?? "");
  const [draftMax, setDraftMax] = useState(max?.toString() ?? "");
  useEffect(() => setDraftMin(min?.toString() ?? ""), [min]);
  useEffect(() => setDraftMax(max?.toString() ?? ""), [max]);
  const commit = () =>
    onCommit(draftMin === "" ? null : Number(draftMin), draftMax === "" ? null : Number(draftMax));
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={cn(textClass.meta, "w-36 text-muted-foreground")}>{label}</span>
      <Input
        type="number"
        inputMode="decimal"
        value={draftMin}
        onChange={(e) => setDraftMin(e.target.value)}
        onBlur={commit}
        placeholder="mín."
        className="h-9 w-28 shadow-none"
        aria-label={`${label} mínimo`}
      />
      <span className={cn(textClass.meta, "text-muted-foreground")}>a</span>
      <Input
        type="number"
        inputMode="decimal"
        value={draftMax}
        onChange={(e) => setDraftMax(e.target.value)}
        onBlur={commit}
        placeholder="máx."
        className="h-9 w-28 shadow-none"
        aria-label={`${label} máximo`}
      />
      <span className={cn(textClass.meta, textClass.numeric, "text-muted-foreground")}>{hint}</span>
    </div>
  );
}

/** The richest filter panel of the product: the segment you build here is the campaign list. */
export function RfmFilters({
  options,
  search,
  onPatch,
}: {
  options: RfmFilterOptions;
  search: CustomersSearch;
  onPatch: (next: Partial<CustomersSearch>) => void;
}) {
  const { ranges } = options;
  const active = (Object.keys(defaultCustomersSearch) as (keyof CustomersSearch)[]).some(
    (k) =>
      !["aba", "pagina", "porPagina", "ordenar", "direcao", "cupomModo"].includes(k) &&
      JSON.stringify(search[k]) !== JSON.stringify(defaultCustomersSearch[k]),
  );
  const clear = () => {
    const { aba, pagina, porPagina, ordenar, direcao, ...filters } = defaultCustomersSearch;
    void aba;
    void pagina;
    void porPagina;
    void ordenar;
    void direcao;
    onPatch(filters);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <MultiSelect
          label="Segmentos RFM"
          options={options.segmento}
          value={search.segmento}
          onChange={(v) => onPatch({ segmento: v })}
        />
        <MultiSelect
          label="Origem"
          options={options.origem}
          value={search.origem}
          onChange={(v) => onPatch({ origem: v })}
        />
        <MultiSelect
          label="Dias sem comprar"
          options={inactivityBands.map((b) => ({ value: b, label: bandLabel[b] }))}
          value={search.inatividade}
          onChange={(v) => onPatch({ inatividade: v as InactivityBand[] })}
        />
        <MultiSelect
          label="Gateway"
          options={options.gateway}
          value={search.gateway}
          onChange={(v) => onPatch({ gateway: v })}
        />
        <MultiSelect
          label="Método"
          options={options.metodo}
          value={search.metodo}
          onChange={(v) => onPatch({ metodo: v })}
        />
        <MultiSelect
          label="Estado"
          options={options.uf}
          value={search.uf}
          onChange={(v) => onPatch({ uf: v })}
        />
        <MultiSelect
          label="Cidade"
          options={options.cidade}
          value={search.cidade}
          onChange={(v) => onPatch({ cidade: v })}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <MultiSelect
          label="Comprou"
          options={options.comprou}
          value={search.comprou}
          onChange={(v) => onPatch({ comprou: v })}
        />
        <MultiSelect
          label="Não comprou"
          options={options.naoComprou}
          value={search.naoComprou}
          onChange={(v) => onPatch({ naoComprou: v })}
        />
        <MultiSelect
          label="Cupons"
          options={options.cupom}
          value={search.cupom}
          onChange={(v) => onPatch({ cupom: v })}
        />
        <Button
          variant="outline"
          size="sm"
          className="h-9 shadow-none"
          onClick={() =>
            onPatch({ cupomModo: search.cupomModo === "incluir" ? "excluir" : "incluir" })
          }
          aria-pressed={search.cupomModo === "excluir"}
        >
          {search.cupomModo === "incluir" ? "Incluir quem usou" : "Excluir quem usou"}
        </Button>
        {active && (
          <Button variant="ghost" size="sm" className="h-9" onClick={clear}>
            Limpar filtros
          </Button>
        )}
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        <DateRange
          label="Compras entre"
          from={search.comprasDe}
          to={search.comprasAte}
          onChange={(comprasDe, comprasAte) => onPatch({ comprasDe, comprasAte })}
        />
        <DateRange
          label="Primeira compra entre"
          from={search.primeiraDe}
          to={search.primeiraAte}
          onChange={(primeiraDe, primeiraAte) => onPatch({ primeiraDe, primeiraAte })}
        />
        <DateRange
          label="Última compra entre"
          from={search.ultimaDe}
          to={search.ultimaAte}
          onChange={(ultimaDe, ultimaAte) => onPatch({ ultimaDe, ultimaAte })}
        />
        <NumberRange
          label="Total vendido"
          hint={`${formatCurrency(ranges.totalMin)} – ${formatCurrency(ranges.totalMax)}`}
          min={search.totalMin}
          max={search.totalMax}
          onCommit={(totalMin, totalMax) => onPatch({ totalMin, totalMax })}
        />
        <NumberRange
          label="Pedidos"
          hint={`${ranges.ordersMin} – ${ranges.ordersMax}`}
          min={search.pedidosMin}
          max={search.pedidosMax}
          onCommit={(pedidosMin, pedidosMax) => onPatch({ pedidosMin, pedidosMax })}
        />
      </div>
    </div>
  );
}
