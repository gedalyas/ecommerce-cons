import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, CircleDashed, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import type { ConnectionsScreen, DataSourceStatus } from "@ecommerce/contracts/connections";
import { summaryDetail } from "@ecommerce/contracts/connections";
import {
  connectionRequestStatusLabel,
  connectorFeedLabel,
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
import { requestConnectionFn } from "./connectionsController";

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
}: {
  connector: StoreConnector;
  onRequest: (c: StoreConnector) => void;
}) {
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

export function Connections({
  data,
  imports,
}: {
  data: ConnectionsScreen;
  imports: ImportsScreen;
}) {
  const detail = summaryDetail(data.summary);
  const [requesting, setRequesting] = useState<StoreConnector | null>(null);
  return (
    <div className={layout.page}>
      <PageHeader title="Conexões" subtitle="Fontes que alimentam os indicadores da loja" />

      <div className={cn(layout.headerGap, layout.blockStack)}>
        <AlertBanner icon={false}>
          <span className={cn(textClass.numeric, "font-semibold text-foreground")}>
            {data.summary.active} de {data.summary.total} fontes ativas
          </span>
          {detail && <span className="text-muted-foreground"> · {detail}</span>}
        </AlertBanner>

        <SectionBlock>
          <div className="hidden border-b border-border px-5 py-3 md:flex md:items-center md:gap-4">
            <span className={cn(textClass.label, "min-w-0 flex-1 text-muted-foreground")}>
              Fonte
            </span>
            <span className={cn(textClass.label, "w-48 text-muted-foreground")}>Status</span>
            <span className={cn(textClass.label, "w-40 text-muted-foreground")}>Sincronização</span>
            <span className={cn(textClass.label, "w-40 text-muted-foreground")}>Ação</span>
          </div>
          <ul className="divide-y divide-border">
            {data.connectors.map((c) => {
              const meta = statusMeta[c.status];
              const Icon = meta.icon;
              return (
                <li
                  key={c.key}
                  className="flex flex-col gap-3 px-5 py-4 md:flex-row md:flex-wrap md:items-center md:gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-[15px] font-semibold text-foreground">{c.label}</div>
                    <div className={cn(textClass.meta, "text-muted-foreground")}>
                      {c.description} · {c.feeds.map((f) => connectorFeedLabel[f]).join(", ")}
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
                    className={cn(
                      textClass.numeric,
                      textClass.meta,
                      "w-full text-muted-foreground md:w-40",
                    )}
                  >
                    {c.syncLabel}
                  </div>
                  <div className="md:w-40">
                    <ConnectorAction connector={c} onRequest={setRequesting} />
                  </div>
                </li>
              );
            })}
          </ul>
        </SectionBlock>

        <div id="importacao">
          <ImportPanel data={imports} />
        </div>
      </div>

      <RequestDialog connector={requesting} onClose={() => setRequesting(null)} />
    </div>
  );
}
