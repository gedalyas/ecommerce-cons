import { ChevronDown } from "lucide-react";
import type { IntegrationPageSearch } from "@ecommerce/contracts/connections";
import {
  connectorCategories,
  connectorCategoryLabel,
  connectorsOfCategory,
  type StoreConnector,
} from "@ecommerce/contracts/connectors";
import { Button } from "@/shared/ui/Button";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { IntegrationCard } from "./IntegrationCard";
import { splitByLink } from "./integrationRules";

type Open = (connector: StoreConnector, tab?: IntegrationPageSearch["aba"]) => void;

type Props = {
  connectors: StoreConnector[];
  onBrowse: () => void;
  onOpen: Open;
};

const keyOf = (c: StoreConnector) => `${c.key}:${c.connection?.id ?? ""}`;

function CardGrid({ items, onOpen }: { items: StoreConnector[]; onOpen: Open }) {
  return (
    <ul className="grid grid-cols-1 gap-3 @xl:grid-cols-2">
      {items.map((c) => (
        <li key={keyOf(c)}>
          <IntegrationCard connector={c} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  );
}

function ByCategory({ items, onOpen }: { items: StoreConnector[]; onOpen: Open }) {
  return (
    <>
      {connectorCategories.map((category) => {
        const group = connectorsOfCategory(items, category).sections.flatMap((s) => s.items);
        if (group.length === 0) return null;
        return (
          <section key={category} className="flex flex-col gap-3">
            <h2 className={cn(textClass.cardTitle, "text-foreground")}>
              {connectorCategoryLabel[category]}
            </h2>
            <CardGrid items={group} onOpen={onOpen} />
          </section>
        );
      })}
    </>
  );
}

export function MyIntegrations({ connectors, onBrowse, onOpen }: Props) {
  if (connectors.length === 0) {
    return (
      <SectionBlock bodyClassName={layout.cardPadding}>
        <div className="flex flex-col items-start gap-3">
          <p className={cn(textClass.body, "text-muted-foreground")}>
            A loja ainda não tem integrações. Comece pelo ERP: é de onde vêm as vendas de todos os
            canais.
          </p>
          <Button onClick={onBrowse}>Ver integrações</Button>
        </div>
      </SectionBlock>
    );
  }
  const { linked, disconnected } = splitByLink(connectors);
  return (
    <div className={cn("@container", layout.blockStack)}>
      <ByCategory items={linked} onOpen={onOpen} />
      {disconnected.length > 0 && (
        <details className="group flex flex-col gap-3">
          <summary
            className={cn(
              textClass.cardTitle,
              "flex cursor-pointer list-none items-center gap-2 text-muted-foreground",
            )}
          >
            <ChevronDown
              aria-hidden
              className="h-4 w-4 transition-transform duration-150 group-open:rotate-180"
            />
            Desconectadas ({disconnected.length})
          </summary>
          <div className="mt-3 opacity-70">
            <CardGrid items={disconnected} onOpen={onOpen} />
          </div>
        </details>
      )}
    </div>
  );
}
