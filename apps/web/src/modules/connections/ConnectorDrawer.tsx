import { useState, type ReactNode } from "react";
import {
  connectorGuides,
  guideSteps,
  kindOwnership,
  type DataOwners,
  type StoreConnector,
} from "@ecommerce/contracts/connectors";
import { Badge } from "@/shared/ui/Badge";
import { Sheet } from "@/shared/ui/Sheet";
import { TabBar } from "@/shared/ui/TabBar";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { ConnectorLogo } from "./ConnectorLogo";
import { DataSourceSwitch } from "./DataSourceSwitch";

type Tab = "connect" | "data" | "help";

const tabs = [
  { key: "connect", label: "Conectar" },
  { key: "data", label: "O que puxa" },
  { key: "help", label: "Ajuda" },
] as const;

function DataTab({ connector, owners }: { connector: StoreConnector; owners: DataOwners }) {
  const rows = kindOwnership(connector.provides, connector.key, owners);
  return (
    <div className="flex flex-col gap-3">
      <p className={cn(textClass.meta, "text-muted-foreground")}>
        Cada tipo de dado tem uma fonte só por loja, para nenhuma venda ser contada duas vezes.
        Vendas vêm só do ERP ou da planilha; anúncios nunca trazem vendas.
      </p>
      <ul className="divide-y divide-border">
        {rows.map((row) => (
          <li key={row.kind} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <span className={cn(textClass.body, "text-foreground")}>{row.label}</span>
            <span className="flex items-center gap-2">
              <Badge tone={row.owner === "other" ? "warning" : "outline"}>{row.text}</Badge>
              <DataSourceSwitch connector={connector} row={row} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HelpTab({ connector }: { connector: StoreConnector }) {
  const guide = connectorGuides[connector.key];
  return (
    <div className="flex flex-col gap-4">
      <ol className="flex list-decimal flex-col gap-2 pl-5">
        {guideSteps(connector).map((step) => (
          <li key={step} className={cn(textClass.body, "text-foreground")}>
            {step}
          </li>
        ))}
      </ol>
      {guide.modalities.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className={cn(textClass.label, "text-muted-foreground")}>Modalidades</p>
          <ul className="flex flex-col gap-2">
            {guide.modalities.map((m) => (
              <li key={m.key} className={cn(textClass.meta, "text-foreground")}>
                <span className="font-semibold">{m.label}:</span> {m.help}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ConnectTab({
  connector,
  action,
  onAction,
}: {
  connector: StoreConnector;
  action: ReactNode;
  onAction: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className={cn(textClass.body, "text-foreground")}>{connector.description}</p>
      {connector.requirements.length > 0 && (
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {connector.requirements.map((r) => (
            <li key={r} className={cn(textClass.meta, "text-muted-foreground")}>
              {r}
            </li>
          ))}
        </ul>
      )}
      <div onClickCapture={onAction}>{action}</div>
    </div>
  );
}

export function ConnectorDrawer({
  connector,
  owners,
  action,
  onClose,
}: {
  connector: StoreConnector | null;
  owners: DataOwners;
  action: ReactNode;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("connect");
  if (!connector) return null;
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={connector.label}
      className="sm:mx-auto sm:max-w-lg"
    >
      <div className="flex flex-col gap-4 overflow-y-auto px-4 py-4">
        <div className="flex items-center gap-3">
          <ConnectorLogo connectorKey={connector.key} label={connector.label} />
          <TabBar tabs={tabs} value={tab} onChange={setTab} className="min-w-0 flex-1" />
        </div>
        {tab === "connect" && (
          <ConnectTab connector={connector} action={action} onAction={onClose} />
        )}
        {tab === "data" && <DataTab connector={connector} owners={owners} />}
        {tab === "help" && <HelpTab connector={connector} />}
      </div>
    </Sheet>
  );
}
