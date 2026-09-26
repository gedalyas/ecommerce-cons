import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import type { ConnectionCheck, StoreConnector } from "@ecommerce/contracts/connectors";
import { formatDate, formatNumber } from "@ecommerce/contracts/shared/format";
import { Button } from "@/shared/ui/Button";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { testConnectionFn } from "./connectionsController";

const toneClass: Record<ConnectionCheck["verdict"]["tone"], string> = {
  ok: "text-primary",
  warning: "text-warning",
  error: "text-destructive",
};

function CheckResult({ check }: { check: ConnectionCheck }) {
  const { access } = check;
  return (
    <div className="flex flex-col gap-1" role="status">
      <p className={cn(textClass.body, "font-semibold", toneClass[check.verdict.tone])}>
        {check.verdict.text}
      </p>
      {access.status === "ok" && (
        <p className={cn(textClass.meta, "text-muted-foreground")}>Conta: {access.accountLabel}</p>
      )}
      {access.status === "refused" && (
        <p className={cn(textClass.meta, "text-muted-foreground")}>{access.message}</p>
      )}
      <p className={cn(textClass.meta, "text-muted-foreground")}>
        Últimos 7 dias:{" "}
        {check.received.length === 0
          ? "nada recebido"
          : check.received.map((r) => `${r.label} ${formatNumber(r.rows)}`).join(" · ")}
      </p>
      <p className={cn(textClass.meta, "text-muted-foreground")}>
        Última sincronização:{" "}
        {check.lastSyncAt
          ? formatDate(check.lastSyncAt, {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "ainda não houve"}
      </p>
    </div>
  );
}

export function ConnectionTest({ connector }: { connector: StoreConnector }) {
  const test = useServerFn(testConnectionFn);
  const [busy, setBusy] = useState(false);
  const [check, setCheck] = useState<ConnectionCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!connector.connection || !connector.canManage) return null;
  const run = async () => {
    setBusy(true);
    try {
      const result = await test({ data: { key: connector.key } });
      setCheck(result.ok ? result.value : null);
      setError(result.ok ? null : result.message);
    } catch {
      setError("Não foi possível testar a conexão agora.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn(textClass.body, "text-foreground")}>
          Confira se a integração está trazendo os dados.
        </p>
        <Button variant="outline" size="sm" disabled={busy} onClick={() => void run()}>
          {busy ? "Testando…" : "Testar"}
        </Button>
      </div>
      {error && <p className={cn(textClass.meta, "text-destructive")}>{error}</p>}
      {check && <CheckResult check={check} />}
    </div>
  );
}
