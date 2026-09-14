import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import type { StoreConnector } from "@ecommerce/contracts/connectors";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/Input";
import { radiusClass } from "@/shared/styles/radius";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { startConnectorFn } from "./connectionsController";

export function ConnectDialog({
  connector,
  onClose,
}: {
  connector: StoreConnector | null;
  onClose: () => void;
}) {
  const start = useServerFn(startConnectorFn);
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsDomain = connector?.authPattern === "domain_oauth";
  const hint = connector?.domainHint ?? null;
  const requirements = connector?.requirements ?? [];

  const submit = async () => {
    if (!connector) return;
    setBusy(true);
    setError(null);
    const result = await start({ data: { key: connector.key, domain } });
    if (!result.ok) {
      setBusy(false);
      setError(result.message);
      return;
    }
    window.location.assign(result.url);
  };

  return (
    <Dialog
      open={connector !== null}
      onOpenChange={(open) => !open && !busy && onClose()}
      title={connector ? `Conectar-se a ${connector.label}` : ""}
      description="Você será levado à plataforma para autorizar o acesso; depois voltamos para cá e o histórico começa a ser importado."
      className="max-w-md"
    >
      <div className="grid gap-3">
        {requirements.length > 0 && (
          <div className={cn(radiusClass.control, "border border-border bg-muted/40 px-3 py-2")}>
            <div className={cn(textClass.label, "text-muted-foreground")}>Antes de conectar</div>
            <ul className={cn(textClass.meta, "mt-1 list-disc space-y-1 pl-4 text-foreground")}>
              {requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {needsDomain && (
          <FormField label="Endereço da loja" hint={hint?.help}>
            <Input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder={hint?.placeholder ?? "minhaloja.com.br"}
              autoFocus
            />
          </FormField>
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
          <Button onClick={() => void submit()} disabled={busy || (needsDomain && !domain.trim())}>
            {busy ? "Abrindo…" : connector ? `Conectar-se a ${connector.label}` : "Conectar"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
