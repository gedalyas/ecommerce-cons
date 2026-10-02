import { AlertTriangle, CheckCircle2, CircleDashed, FileSpreadsheet } from "lucide-react";
import {
  dataKindLabel,
  type DataSourceStatus,
  type StoreConnector,
} from "@ecommerce/contracts/connectors";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { ConnectorAction } from "./ConnectorAction";
import { ConnectorLogo } from "./ConnectorLogo";
import { ConnectionStepper } from "./ConnectionStepper";

const statusMeta: Record<
  DataSourceStatus,
  { label: string; icon: typeof CheckCircle2; className: string }
> = {
  CONNECTED: { label: "Conectado", icon: CheckCircle2, className: "text-primary" },
  ERROR: { label: "Erro de autenticação", icon: AlertTriangle, className: "text-warning" },
  NOT_CONNECTED: {
    label: "Não conectado",
    icon: CircleDashed,
    className: "text-muted-foreground",
  },
  MANUAL: { label: "Importação manual", icon: FileSpreadsheet, className: "text-muted-foreground" },
};

export function ConnectorRow({
  connector: c,
  onRequest,
  onConnect,
  onSettings,
  onDetails,
}: {
  connector: StoreConnector;
  onRequest: (c: StoreConnector) => void;
  onConnect: (c: StoreConnector) => void;
  onSettings: (c: StoreConnector) => void;
  onDetails: (c: StoreConnector) => void;
}) {
  const meta = statusMeta[c.status];
  const Icon = meta.icon;
  return (
    <li className="flex flex-col gap-3 px-5 py-4 md:flex-row md:flex-wrap md:items-center md:gap-4">
      <div className="min-w-0 md:w-full 2xl:w-auto 2xl:flex-1">
        <div className="flex items-center gap-3">
          <ConnectorLogo connectorKey={c.key} label={c.label} />
          <div className={cn(textClass.body, "min-w-0 font-semibold text-foreground")}>
            {c.label}
            {c.connection && c.connection.name !== c.label && (
              <span className="font-normal text-muted-foreground"> · {c.connection.name}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onDetails(c)}
            aria-label={`Detalhes de ${c.label}`}
            className={cn(textClass.meta, "ml-auto font-semibold text-primary md:ml-0")}
          >
            Detalhes
          </button>
        </div>
        <div className={cn(textClass.meta, "text-muted-foreground")}>
          {c.description} Fornece: {c.provides.map((k) => dataKindLabel[k]).join(", ")}.
        </div>
      </div>
      <div
        className={cn(
          textClass.meta,
          "flex min-w-0 items-center gap-2 font-semibold md:w-48",
          meta.className,
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {meta.label}
      </div>
      <div
        className={cn(textClass.numeric, textClass.meta, "w-full text-muted-foreground md:w-40")}
      >
        {c.syncLabel}
      </div>
      <div className="md:w-40">
        <ConnectorAction
          connector={c}
          onRequest={onRequest}
          onConnect={onConnect}
          onSettings={onSettings}
        />
      </div>
      {c.connection && (
        <div className="w-full border-t border-border pt-3">
          <ConnectionStepper connection={c.connection} />
        </div>
      )}
    </li>
  );
}
