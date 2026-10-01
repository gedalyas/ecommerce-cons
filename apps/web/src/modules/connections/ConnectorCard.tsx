import { AlertTriangle, CheckCircle2, FileSpreadsheet } from "lucide-react";
import type { StoreConnector } from "@ecommerce/contracts/connectors";
import { Badge } from "@/shared/ui/Badge";
import { radiusClass } from "@/shared/styles/radius";
import { shadowClass } from "@/shared/styles/shadows";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { ConnectorLogo } from "./ConnectorLogo";
import { cardStateOf } from "./integrationRules";

type Props = {
  connector: StoreConnector;
  recommended: boolean;
  onOpen: (connector: StoreConnector) => void;
};

export function ConnectorCard({ connector, recommended, onOpen }: Props) {
  const state = cardStateOf(connector);
  return (
    <button
      type="button"
      onClick={() => onOpen(connector)}
      className={cn(
        "flex w-full items-start gap-3 border border-border bg-card p-4 text-left transition-shadow duration-150 hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        radiusClass.card,
        shadowClass.sm,
        "hover:shadow-md",
      )}
    >
      <ConnectorLogo connectorKey={connector.key} label={connector.label} className="h-12 w-12" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={cn(textClass.body, "font-semibold text-foreground")}>
          {connector.label}
        </span>
        <span className={cn(textClass.meta, "line-clamp-2 text-muted-foreground")}>
          {connector.description}
        </span>
        <span className="mt-1 flex flex-wrap gap-1">
          {state === "connected" && (
            <Badge tone="accent">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Conectada
            </Badge>
          )}
          {state === "error" && (
            <Badge tone="warning">
              <AlertTriangle className="h-3 w-3 text-warning" aria-hidden />
              Com erro
            </Badge>
          )}
          {state === "manual" && (
            <Badge tone="muted">
              <FileSpreadsheet className="h-3 w-3" aria-hidden />
              Por planilha
            </Badge>
          )}
          {recommended && <Badge tone="outline">Recomendado</Badge>}
        </span>
      </span>
    </button>
  );
}
