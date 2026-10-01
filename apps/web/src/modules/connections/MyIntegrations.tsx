import {
  connectorGroups,
  connectorKindLabel,
  type StoreConnector,
} from "@ecommerce/contracts/connectors";
import { Button } from "@/shared/ui/Button";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { ConnectorRow } from "./ConnectorRow";

type Handler = (connector: StoreConnector) => void;

type Props = {
  connectors: StoreConnector[];
  onBrowse: () => void;
  onRequest: Handler;
  onConnect: Handler;
  onSettings: Handler;
  onDetails: Handler;
};

export function MyIntegrations({ connectors, onBrowse, ...handlers }: Props) {
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
  return (
    <>
      {connectorGroups(connectors).map((group) => (
        <SectionBlock key={group.kind} title={connectorKindLabel[group.kind]} bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {group.items.map((c) => (
              <ConnectorRow key={c.key} connector={c} {...handlers} />
            ))}
          </ul>
        </SectionBlock>
      ))}
    </>
  );
}
