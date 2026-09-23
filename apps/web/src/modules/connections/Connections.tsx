import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, CircleDashed, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import type { ConnectionsScreen } from "@ecommerce/contracts/connections";
import { summaryDetail } from "@ecommerce/contracts/connections";
import type { DataSourceStatus } from "@ecommerce/contracts/connectors";
import {
  connectionRequestStatusLabel,
  connectorErrorReasonLabel,
  dataKindLabel,
  connectorGroups,
  connectorKindGuide,
  connectorKindLabel,
  type ConnectorErrorReason,
  type StoreConnector,
} from "@ecommerce/contracts/connectors";
import type { ImportsScreen } from "@ecommerce/contracts/imports";
import { ImportPanel } from "@/modules/imports/contract";
import { AlertBanner } from "@/shared/ui/AlertBanner";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionBlock } from "@/shared/ui/SectionBlock";
import { Textarea } from "@/shared/ui/Textarea";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { ConnectDialog } from "./ConnectDialog";
import { ConnectorLogo } from "./ConnectorLogo";
import { ConnectionStepper } from "./ConnectionStepper";
import { StatusMappingDialog } from "./StatusMappingDialog";
import {
  disconnectConnectorFn,
  requestConnectionFn,
  syncConnectorFn,
} from "./connectionsController";

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

function ConnectorAction({
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
      <a href="#importacao" className={cn(textClass.meta, "font-semibold text-primary")}>
        Importar CSV
      </a>
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

function RequestDialog({
  connector,
  onClose,
}: {
  connector: StoreConnector | null;
  onClose: () => void;
}) {
  const request = useServerFn(requestConnectionFn);
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!connector) return;
    setBusy(true);
    setError(null);
    const result = await request({ data: { key: connector.key, note } });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setNote("");
    onClose();
    await router.invalidate();
  };

  return (
    <Dialog
      open={connector !== null}
      onOpenChange={(open) => !open && !busy && onClose()}
      title={connector ? `Solicitar conexão com ${connector.label}` : ""}
      description="Sua consultoria recebe o pedido e conduz a integração com você."
    >
      <div className="grid gap-3">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Alguma observação? Conta, responsável, urgência…"
          aria-label="Observação"
        />
        {error && (
          <p role="alert" className={cn(textClass.meta, "text-destructive")}>
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} disabled={busy}>
            {busy ? "Enviando…" : "Solicitar"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function ConnectorRow({
  connector: c,
  onRequest,
  onConnect,
  onSettings,
}: {
  connector: StoreConnector;
  onRequest: (c: StoreConnector) => void;
  onConnect: (c: StoreConnector) => void;
  onSettings: (c: StoreConnector) => void;
}) {
  const meta = statusMeta[c.status];
  const Icon = meta.icon;
  return (
    <li className="flex flex-col gap-3 px-5 py-4 md:flex-row md:flex-wrap md:items-center md:gap-4">
      <div className="min-w-0 md:w-full 2xl:w-auto 2xl:flex-1">
        <div className="flex items-center gap-3">
          <ConnectorLogo connectorKey={c.key} label={c.label} />
          <div className="text-[15px] font-semibold text-foreground">{c.label}</div>
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

export function Connections({
  data,
  imports,
  justConnected,
  chooseAccount,
  failed,
  failureReason,
}: {
  data: ConnectionsScreen;
  imports: ImportsScreen;
  justConnected: string;
  chooseAccount: boolean;
  failed: string;
  failureReason: ConnectorErrorReason;
}) {
  const connected = data.connectors.find((c) => c.key === justConnected) ?? null;
  const failedConnector = data.connectors.find((c) => c.key === failed) ?? null;
  const connectedLabel = connected?.label ?? null;
  const detail = summaryDetail(data.summary);
  const [requesting, setRequesting] = useState<StoreConnector | null>(null);
  const [connecting, setConnecting] = useState<StoreConnector | null>(null);
  const [mapping, setMapping] = useState<StoreConnector | null>(() =>
    chooseAccount && connected?.connection?.needsAccount ? connected : null,
  );
  return (
    <div className={layout.page}>
      <PageHeader title="Conexões" subtitle="Fontes que alimentam os indicadores da loja" />

      <div className={cn(layout.headerGap, layout.blockStack)}>
        {connectedLabel && (
          <AlertBanner icon={false}>
            <span role="status" className="font-semibold text-foreground">
              {connected?.connection?.needsAccount
                ? `${connectedLabel} conectado. Escolha a conta para começar a importação.`
                : `${connectedLabel} conectado. O histórico está sendo importado — acompanhe abaixo.`}
            </span>
          </AlertBanner>
        )}
        {failed && (
          <AlertBanner
            action={
              failedConnector && failedConnector.availability === "oauth" ? (
                <Button size="sm" variant="outline" onClick={() => setConnecting(failedConnector)}>
                  Tentar de novo
                </Button>
              ) : undefined
            }
          >
            <span role="alert" className="text-foreground">
              {failedConnector
                ? `Não foi possível conectar ${failedConnector.label}. `
                : "Não foi possível concluir a conexão. "}
              {connectorErrorReasonLabel[failureReason]}
            </span>
          </AlertBanner>
        )}
        <AlertBanner icon={false}>
          <span className={cn(textClass.numeric, "font-semibold text-foreground")}>
            {data.summary.active} de {data.summary.total} fontes ativas
          </span>
          {detail && <span className="text-muted-foreground"> · {detail}</span>}
        </AlertBanner>

        {connectorGroups(data.connectors).map((group) => (
          <SectionBlock
            key={group.kind}
            title={`${connectorKindGuide[group.kind].order}. ${connectorKindLabel[group.kind]}`}
            description={connectorKindGuide[group.kind].hint}
            bodyClassName="p-0"
          >
            <ul className="divide-y divide-border">
              {group.items.map((c) => (
                <ConnectorRow
                  key={c.key}
                  connector={c}
                  onRequest={setRequesting}
                  onConnect={setConnecting}
                  onSettings={setMapping}
                />
              ))}
            </ul>
          </SectionBlock>
        ))}

        <div id="importacao">
          <ImportPanel data={imports} />
        </div>
      </div>

      <RequestDialog connector={requesting} onClose={() => setRequesting(null)} />
      <ConnectDialog connector={connecting} onClose={() => setConnecting(null)} />
      <StatusMappingDialog connector={mapping} onClose={() => setMapping(null)} />
    </div>
  );
}
