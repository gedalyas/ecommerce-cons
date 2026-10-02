import type { IntegrationPageSearch } from "@ecommerce/contracts/connections";
import type { StoreConnector } from "@ecommerce/contracts/connectors";
import { Badge } from "@/shared/ui/Badge";
import { radiusClass } from "@/shared/styles/radius";
import { shadowClass } from "@/shared/styles/shadows";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { ConnectorLogo } from "./ConnectorLogo";
import { IntegrationActions } from "./IntegrationActions";
import {
  integrationStatusLabel,
  integrationStatusOf,
  type IntegrationStatus,
} from "./integrationRules";

const statusClass: Record<IntegrationStatus, string> = {
  ready: "text-primary",
  syncing: "text-muted-foreground",
  error: "text-warning",
  account: "text-warning",
};

type Props = {
  connector: StoreConnector;
  onOpen: (connector: StoreConnector, tab?: IntegrationPageSearch["aba"]) => void;
};

export function IntegrationCard({ connector, onOpen }: Props) {
  const connection = connector.connection;
  const status = connection ? integrationStatusOf(connection) : null;
  return (
    <div
      className={cn(
        "flex items-start gap-2 border border-border bg-card p-4",
        radiusClass.card,
        shadowClass.sm,
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(connector)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ConnectorLogo connectorKey={connector.key} label={connector.label} className="h-12 w-12" />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className={cn(textClass.body, "truncate font-semibold text-foreground")}>
            {connection?.name ?? connector.label}
          </span>
          <span className={cn(textClass.meta, "truncate text-muted-foreground")}>
            {connection && connection.name !== connector.label ? `${connector.label} · ` : ""}
            {connection?.externalLabel || connector.description}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {status ? (
              <span className={cn(textClass.meta, "font-semibold", statusClass[status])}>
                {integrationStatusLabel[status]}
              </span>
            ) : connector.status === "MANUAL" ? (
              <Badge tone="muted">Por planilha</Badge>
            ) : (
              <span className={cn(textClass.meta, "font-semibold text-muted-foreground")}>
                Desconectada
              </span>
            )}
            <span className={cn(textClass.meta, textClass.numeric, "text-muted-foreground")}>
              {connector.syncLabel}
            </span>
          </span>
        </span>
      </button>
      <IntegrationActions connector={connector} onOpen={(tab) => onOpen(connector, tab)} />
    </div>
  );
}
