import { useBlocker } from "@tanstack/react-router";
import type { StoreConnector } from "@ecommerce/contracts/connectors";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { ConnectorSettingsFields } from "./ConnectorSettingsFields";
import { useConnectorSettings } from "./useConnectorSettings";

function SettingsForm({ connector }: { connector: StoreConnector }) {
  const state = useConnectorSettings(connector);
  const blocker = useBlocker({
    shouldBlockFn: () => state.edited && !state.busy,
    withResolver: true,
    enableBeforeUnload: false,
  });
  return (
    <div className="flex flex-col gap-4">
      <ConnectorSettingsFields state={state} />
      <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-border bg-card py-3">
        {state.edited && (
          <span className={cn(textClass.meta, "text-muted-foreground")}>Alterações não salvas</span>
        )}
        <Button onClick={() => void state.submit()} disabled={state.busy || !state.dirty}>
          {state.busy ? "Salvando…" : "Salvar"}
        </Button>
      </div>
      <Dialog
        open={blocker.status === "blocked"}
        onOpenChange={(open) => {
          if (!open && blocker.status === "blocked") blocker.reset();
        }}
        title="Descartar alterações não salvas?"
        description="Você mudou as configurações desta integração e ainda não salvou."
      >
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => blocker.status === "blocked" && blocker.reset()}>
            Continuar editando
          </Button>
          <Button
            variant="destructive"
            onClick={() => blocker.status === "blocked" && blocker.proceed()}
          >
            Descartar
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

export function SettingsPanel({ connector }: { connector: StoreConnector }) {
  if (!connector.connection) {
    return (
      <p className={cn(textClass.body, "text-muted-foreground")}>
        Conecte {connector.label} para escolher a conta e as demais configurações.
      </p>
    );
  }
  if (!connector.canManage) {
    return (
      <p className={cn(textClass.body, "text-muted-foreground")}>
        Somente quem cuida desta área altera as configurações.
      </p>
    );
  }
  if (connector.kind === "storefront") {
    return (
      <p className={cn(textClass.body, "text-muted-foreground")}>
        {connector.label} não tem configurações: a loja autorizada é a que está conectada.
      </p>
    );
  }
  return <SettingsForm connector={connector} />;
}
