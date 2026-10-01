import { Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { connectionRequestStatusLabel, type StoreConnector } from "@ecommerce/contracts/connectors";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { disconnectConnectorFn, syncConnectorFn } from "./connectionsController";

export function ConnectorAction({
  connector,
  onRequest,
  onConnect,
  onSettings,
}: {
  connector: StoreConnector;
  onRequest: (c: StoreConnector) => void;
  onConnect: (c: StoreConnector) => void;
  onSettings: (c: StoreConnector) => void;
}) {
  if (!connector.canManage) {
    return (
      <span className={cn(textClass.meta, "text-muted-foreground")}>
        {connector.connection || connector.status === "CONNECTED" ? "Somente leitura" : ""}
      </span>
    );
  }
  if (connector.availability === "oauth" && !connector.connection) {
    return (
      <Button size="sm" className="h-11 w-full md:h-8 md:w-40" onClick={() => onConnect(connector)}>
        Conectar
      </Button>
    );
  }
  if (connector.connection) {
    return (
      <ConnectionButtons connector={connector} onSettings={onSettings} onConnect={onConnect} />
    );
  }
  if (connector.availability === "manual") {
    return (
      <Link
        to="/integracoes"
        search={(prev) => ({ ...prev, aba: "planilhas" })}
        className={cn(textClass.meta, "font-semibold text-primary")}
      >
        Importar planilha
      </Link>
    );
  }
  if (connector.request) {
    return <Badge tone="outline">{connectionRequestStatusLabel[connector.request.status]}</Badge>;
  }
  if (connector.status === "CONNECTED") return null;
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-11 w-full md:h-8 md:w-40"
      onClick={() => onRequest(connector)}
    >
      Solicitar conexão
    </Button>
  );
}

function ConnectionButtons({
  connector,
  onSettings,
  onConnect,
}: {
  connector: StoreConnector;
  onSettings: (c: StoreConnector) => void;
  onConnect: (c: StoreConnector) => void;
}) {
  const failed = connector.connection?.stage === "ERROR";
  const needsAccount = connector.connection?.needsAccount ?? false;
  const sync = useServerFn(syncConnectorFn);
  const remove = useServerFn(disconnectConnectorFn);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const run = async (action: () => Promise<{ ok: boolean }>) => {
    setBusy(true);
    try {
      await action();
      await router.invalidate();
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-wrap gap-1">
      {failed && connector.availability === "oauth" && (
        <Button size="sm" disabled={busy} onClick={() => onConnect(connector)}>
          Reconectar
        </Button>
      )}
      {connector.kind !== "storefront" && (
        <Button
          variant={needsAccount ? "default" : "outline"}
          size="sm"
          disabled={busy}
          onClick={() => onSettings(connector)}
        >
          {needsAccount ? "Escolher conta" : "Configurar"}
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        disabled={busy || needsAccount || connector.connection?.stage === "IMPORTING"}
        onClick={() => void run(() => sync({ data: { key: connector.key } }))}
      >
        Sincronizar
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={busy}
        onClick={() => void run(() => remove({ data: { key: connector.key } }))}
      >
        Desconectar
      </Button>
    </div>
  );
}
