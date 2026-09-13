import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  statusMappingTargetLabel,
  statusMappingTargets,
  type ConnectorSettings,
  type StatusMappingTarget,
  type StoreConnector,
} from "@ecommerce/contracts/connectors";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { getConnectorSettings, saveConnectorSettingsFn } from "./connectionsController";

export function StatusMappingDialog({
  connector,
  onClose,
}: {
  connector: StoreConnector | null;
  onClose: () => void;
}) {
  const load = useServerFn(getConnectorSettings);
  const save = useServerFn(saveConnectorSettingsFn);
  const router = useRouter();
  const [settings, setSettings] = useState<ConnectorSettings | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, StatusMappingTarget>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connector) return;
    setSettings(null);
    setError(null);
    void load({ data: { key: connector.key } })
      .then((loaded) => {
        setSettings(loaded);
        setStatusMap(loaded.statusMap);
      })
      .catch(() => setError("Não foi possível ler as situações da plataforma."));
  }, [connector, load]);

  const submit = async () => {
    if (!connector) return;
    setBusy(true);
    setError(null);
    const result = await save({ data: { key: connector.key, statusMap } });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onClose();
    await router.invalidate();
  };

  return (
    <Dialog
      open={connector !== null}
      onOpenChange={(open) => !open && !busy && onClose()}
      title={connector ? `Situações do ${connector.label}` : ""}
      description="Diga o que cada situação do ERP significa para os indicadores. Salvar dispara uma nova sincronização."
    >
      <div className="grid gap-3">
        {!settings && !error && (
          <p className={cn(textClass.meta, "text-muted-foreground")}>Lendo as situações…</p>
        )}
        {settings?.statuses.length === 0 && (
          <p className={cn(textClass.meta, "text-muted-foreground")}>
            A plataforma não devolveu situações.
          </p>
        )}
        {settings && settings.statuses.length > 0 && (
          <ul className="divide-y divide-border">
            {settings.statuses.map((status) => (
              <li key={status.id} className="flex items-center justify-between gap-3 py-2">
                <span className={cn(textClass.body, "min-w-0 flex-1 text-foreground")}>
                  {status.label}
                </span>
                <Select
                  value={statusMap[status.id] ?? "PENDING"}
                  onValueChange={(v) =>
                    setStatusMap((prev) => ({ ...prev, [status.id]: v as StatusMappingTarget }))
                  }
                >
                  <SelectTrigger className="w-40" aria-label={`Situação ${status.label}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusMappingTargets.map((target) => (
                      <SelectItem key={target} value={target}>
                        {statusMappingTargetLabel[target]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </li>
            ))}
          </ul>
        )}
        {error && (
          <p role="alert" className={cn(textClass.meta, "text-destructive")}>
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={() => void submit()} disabled={busy || !settings}>
            {busy ? "Salvando…" : "Salvar e sincronizar"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
