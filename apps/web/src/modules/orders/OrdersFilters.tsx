import { useEffect, useState } from "react";
import { Input } from "@/shared/ui/Input";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import { Button } from "@/shared/ui/Button";
import type { OrdersFilterOptions } from "@ecommerce/contracts/orders";
import {
  ordersFilterKeys,
  type OrdersFilterKey,
  type OrdersSearch,
} from "@ecommerce/contracts/orders";

const filterLabel: Record<OrdersFilterKey, string> = {
  origem: "Origem",
  status: "Status",
  gateway: "Gateway",
  metodo: "Método",
  cupom: "Cupom",
  uf: "Estado",
  cidade: "Cidade",
};

/** Filter bar of Aprovação and Lista: only values present in the period are offered. */
export function OrdersFilters({
  options,
  search,
  onPatch,
  withSearch = false,
  keys = ordersFilterKeys,
}: {
  options: OrdersFilterOptions;
  search: OrdersSearch;
  onPatch: (next: Partial<OrdersSearch>) => void;
  withSearch?: boolean;
  keys?: readonly OrdersFilterKey[];
}) {
  const [query, setQuery] = useState(search.busca);
  useEffect(() => setQuery(search.busca), [search.busca]);

  const active = keys.some((k) => search[k].length > 0) || search.busca !== "";
  const clear = () =>
    onPatch({
      ...Object.fromEntries(keys.map((k) => [k, []])),
      busca: "",
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {withSearch && (
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            onPatch({ busca: query });
          }}
        >
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por pedido, cliente ou e-mail"
            aria-label="Buscar pedidos"
            className="h-9 w-64 shadow-none"
          />
          <Button type="submit" variant="outline" size="sm" className="h-9 shadow-none">
            Buscar
          </Button>
        </form>
      )}
      {keys.map((key) => (
        <MultiSelect
          key={key}
          label={filterLabel[key]}
          options={options[key]}
          value={search[key]}
          onChange={(next) => onPatch({ [key]: next })}
        />
      ))}
      {active && (
        <Button variant="ghost" size="sm" className="h-9" onClick={clear}>
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
