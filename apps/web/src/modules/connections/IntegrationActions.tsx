import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import type { IntegrationPageSearch } from "@ecommerce/contracts/connections";
import type { StoreConnector } from "@ecommerce/contracts/connectors";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/Popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/Tooltip";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { disconnectConnectorFn, syncConnectorFn } from "./connectionsController";

type Props = {
  connector: StoreConnector;
  onOpen: (tab: IntegrationPageSearch["aba"]) => void;
};

const itemClass = cn(
  textClass.body,
  "w-full rounded-md px-3 py-2 text-left hover:bg-muted disabled:opacity-50",
);

export function IntegrationActions({ connector, onOpen }: Props) {
  const connection = connector.connection;
  const sync = useServerFn(syncConnectorFn);
  const remove = useServerFn(disconnectConnectorFn);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  if (!connection || !connector.canManage) return null;
  const ids = { key: connector.key, id: connection.id };
  const label = `Ações de ${connection.name}`;
  const runSync = async () => {
    setSyncing(true);
    setSyncError(null);
    const result = await sync({ data: ids });
    setSyncing(false);
    if (!result.ok) return setSyncError(result.message);
    setOpen(false);
    await router.invalidate();
  };
  const disconnect = async () => {
    setBusy(true);
    const result = await remove({ data: ids });
    setBusy(false);
    if (!result.ok) return setError(result.message);
    setConfirming(false);
    await router.invalidate();
  };
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={label}>
                <MoreVertical aria-hidden />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
        <PopoverContent align="end" className="w-48 p-1">
          <button type="button" className={itemClass} onClick={() => onOpen("conexao")}>
            Testar
          </button>
          {connector.kind !== "storefront" && (
            <button type="button" className={itemClass} onClick={() => onOpen("configuracoes")}>
              Configurar
            </button>
          )}
          <button
            type="button"
            className={itemClass}
            disabled={syncing || connection.stage === "IMPORTING" || connection.needsAccount}
            onClick={() => void runSync()}
          >
            {syncing ? "Sincronizando…" : "Sincronizar"}
          </button>
          {syncError && (
            <p role="alert" className={cn(textClass.meta, "px-3 py-1 text-destructive")}>
              {syncError}
            </p>
          )}
          <button
            type="button"
            className={cn(itemClass, "text-destructive")}
            onClick={() => {
              setOpen(false);
              setError(null);
              setConfirming(true);
            }}
          >
            Desconectar
          </button>
        </PopoverContent>
      </Popover>
      <Dialog
        open={confirming}
        onOpenChange={(next) => !busy && setConfirming(next)}
        title={`Desconectar ${connection.name}?`}
        description="A sincronização para. Os dados já importados continuam nos painéis."
      >
        {error && <p className={cn(textClass.meta, "text-destructive")}>{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setConfirming(false)} disabled={busy}>
            Cancelar
          </Button>
          <Button variant="destructive" disabled={busy} onClick={() => void disconnect()}>
            {busy ? "Desconectando…" : "Desconectar"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
