import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import type { StoreConnector } from "@ecommerce/contracts/connectors";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { Textarea } from "@/shared/ui/Textarea";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { requestConnectionFn } from "./connectionsController";

export function RequestDialog({
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
