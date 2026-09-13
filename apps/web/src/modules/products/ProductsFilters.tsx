import { Button } from "@/shared/ui/Button";
import { MultiSelect } from "@/shared/ui/MultiSelect";
import type { ProductsFilterOptions } from "@ecommerce/contracts/products";
import {
  productsFilterKeys,
  type ProductsFilterKey,
  type ProductsSearch,
} from "@ecommerce/contracts/products";

const filterLabel: Record<ProductsFilterKey, string> = {
  categoria: "Categoria",
  subcategoria: "Subcategoria",
  marca: "Marca",
  colecao: "Coleção",
};

/** Catalog filters shared by Lista and Estoque. */
export function ProductsFilters({
  options,
  search,
  onPatch,
}: {
  options: ProductsFilterOptions;
  search: ProductsSearch;
  onPatch: (next: Partial<ProductsSearch>) => void;
}) {
  const active = productsFilterKeys.some((k) => search[k].length > 0);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {productsFilterKeys.map((key) => (
        <MultiSelect
          key={key}
          label={filterLabel[key]}
          options={options[key]}
          value={search[key]}
          onChange={(next) => onPatch({ [key]: next })}
        />
      ))}
      {active && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={() => onPatch({ categoria: [], subcategoria: [], marca: [], colecao: [] })}
        >
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
