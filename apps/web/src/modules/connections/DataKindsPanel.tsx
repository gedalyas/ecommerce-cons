import { Check, Minus } from "lucide-react";
import {
  dataKindLabel,
  dataKinds,
  kindOwnership,
  type DataOwners,
  type StoreConnector,
} from "@ecommerce/contracts/connectors";
import { Badge } from "@/shared/ui/Badge";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { DataSourceSwitch } from "./DataSourceSwitch";

export function DataKindsPanel({
  connector,
  owners,
}: {
  connector: StoreConnector;
  owners: DataOwners;
}) {
  const rows = kindOwnership(connector.provides, connector.key, owners);
  return (
    <div className="flex flex-col gap-3">
      <p className={cn(textClass.meta, "text-muted-foreground")}>
        Cada tipo de dado tem uma fonte só por loja, para nenhuma venda ser contada duas vezes.
        Vendas vêm só do ERP ou da planilha; anúncios nunca trazem vendas.
      </p>
      <ul className="divide-y divide-border">
        {dataKinds.map((kind) => {
          const row = rows.find((r) => r.kind === kind) ?? null;
          return (
            <li key={kind} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span
                className={cn(
                  textClass.body,
                  "flex items-center gap-2",
                  row ? "text-foreground" : "text-muted-foreground line-through",
                )}
              >
                {row ? (
                  <Check className="h-4 w-4 text-primary" aria-label="Traz" />
                ) : (
                  <Minus className="h-4 w-4" aria-label="Não traz" />
                )}
                {dataKindLabel[kind]}
              </span>
              {row && (
                <span className="flex flex-wrap items-center gap-2">
                  <Badge tone={row.owner === "other" ? "warning" : "outline"}>{row.text}</Badge>
                  <DataSourceSwitch connector={connector} row={row} />
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
