import { Link } from "@tanstack/react-router";
import {
  connectionRequestStatusLabel,
  guideSteps,
  type StoreConnector,
} from "@ecommerce/contracts/connectors";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/Input";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { ConnectionStepper } from "./ConnectionStepper";
import { ConnectionTest } from "./ConnectionTest";
import { ConnectorAction } from "./ConnectorAction";
import { useStartConnection } from "./useStartConnection";

type Handler = (connector: StoreConnector) => void;

function NumberedSteps({ steps }: { steps: string[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, index) => (
        <li key={step} className="flex items-start gap-3">
          <span
            aria-hidden
            className={cn(
              textClass.meta,
              textClass.numeric,
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground",
            )}
          >
            {index + 1}
          </span>
          <span className={cn(textClass.body, "text-foreground")}>{step}</span>
        </li>
      ))}
    </ol>
  );
}

function Requirements({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className={cn(textClass.label, "text-muted-foreground")}>Antes de conectar</p>
      <ul className="flex list-disc flex-col gap-1 pl-5">
        {items.map((item) => (
          <li key={item} className={cn(textClass.meta, "text-foreground")}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OAuthOnboarding({ connector }: { connector: StoreConnector }) {
  const start = useStartConnection(connector);
  const hint = connector.domainHint;
  return (
    <div className="flex flex-col gap-5">
      <p className={cn(textClass.body, "text-foreground")}>
        Fique tranquilo: o E-commerce Insights só lê os dados, nunca altera nada em{" "}
        {connector.label}.
      </p>
      <NumberedSteps steps={guideSteps(connector)} />
      <Requirements items={connector.requirements} />
      {start.needsDomain && (
        <FormField label="Endereço da loja *" hint={hint?.help}>
          <Input
            value={start.domain}
            onChange={(e) => start.setDomain(e.target.value)}
            placeholder={hint?.placeholder ?? "minhaloja.com.br"}
          />
        </FormField>
      )}
      {start.error && (
        <p role="alert" className={cn(textClass.meta, "text-destructive")}>
          {start.error}
        </p>
      )}
      <Button
        className="h-11 w-full"
        disabled={!start.canSubmit}
        onClick={() => void start.submit()}
      >
        {start.busy ? "Abrindo…" : `Conectar com ${connector.label}`}
      </Button>
    </div>
  );
}

function RequestOnboarding({
  connector,
  onRequest,
}: {
  connector: StoreConnector;
  onRequest: Handler;
}) {
  return (
    <div className="flex flex-col gap-5">
      <NumberedSteps steps={guideSteps(connector)} />
      {connector.request ? (
        <p className={cn(textClass.body, "flex items-center gap-2 text-foreground")}>
          Pedido de conexão:
          <Badge tone="outline">{connectionRequestStatusLabel[connector.request.status]}</Badge>
        </p>
      ) : (
        connector.canManage && (
          <Button variant="outline" className="h-11 w-full" onClick={() => onRequest(connector)}>
            Solicitar conexão
          </Button>
        )
      )}
    </div>
  );
}

function Connected({
  connector,
  onConnect,
  onSettings,
}: {
  connector: StoreConnector;
  onConnect: Handler;
  onSettings: Handler;
}) {
  const connection = connector.connection;
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className={cn(textClass.label, "text-muted-foreground")}>Conta</p>
        <p className={cn(textClass.body, "text-foreground")}>{connection?.externalLabel || "—"}</p>
      </div>
      {connection && <ConnectionStepper connection={connection} />}
      <ConnectorAction
        connector={connector}
        onRequest={() => undefined}
        onConnect={onConnect}
        onSettings={onSettings}
      />
      <ConnectionTest connector={connector} />
    </div>
  );
}

export function ConnectionPanel({
  connector,
  onRequest,
  onConnect,
  onSettings,
}: {
  connector: StoreConnector;
  onRequest: Handler;
  onConnect: Handler;
  onSettings: Handler;
}) {
  if (connector.connection || connector.status === "CONNECTED") {
    return <Connected connector={connector} onConnect={onConnect} onSettings={onSettings} />;
  }
  if (connector.availability === "manual") {
    return (
      <p className={cn(textClass.body, "text-foreground")}>
        Os dados entram pela planilha.{" "}
        <Link
          to="/integracoes"
          search={{ aba: "planilhas" }}
          className="font-semibold text-primary underline underline-offset-2"
        >
          Importar planilha
        </Link>
      </p>
    );
  }
  if (connector.availability === "request") {
    return <RequestOnboarding connector={connector} onRequest={onRequest} />;
  }
  if (!connector.canManage) {
    return (
      <p className={cn(textClass.body, "text-muted-foreground")}>
        Peça a quem cuida desta área da loja para conectar {connector.label}.
      </p>
    );
  }
  return <OAuthOnboarding connector={connector} />;
}
