import type { StoreConnector } from "@ecommerce/contracts/connectors";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { ConnectorSettingsFields } from "./ConnectorSettingsFields";
import { useConnectorSettings } from "./useConnectorSettings";

export function StatusMappingDialog({
  connector,
  onClose,
}: {
  connector: StoreConnector | null;
  onClose: () => void;
}) {
  const state = useConnectorSettings(connector);
  const choosing = connector?.connection?.needsAccount ?? false;
  const save = async () => {
    if (await state.submit()) onClose();
  };
  return (
    <Dialog
      open={connector !== null}
      onOpenChange={(open) => !open && !state.busy && onClose()}
      title={
        connector ? `${choosing ? "Escolha a conta" : "Configurações"} · ${connector.label}` : ""
      }
      description={
        choosing
          ? "A importação do histórico começa assim que você salvar."
          : "Salvar dispara uma nova sincronização."
      }
    >
      <div className="grid gap-3">
        <ConnectorSettingsFields state={state} />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={state.busy}>
            Cancelar
          </Button>
          <Button onClick={() => void save()} disabled={state.busy || !state.settings}>
            {state.busy ? "Salvando…" : "Salvar e sincronizar"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
