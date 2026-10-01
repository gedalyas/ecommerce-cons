import {
  statusMappingTargetLabel,
  statusMappingTargets,
  type StatusMappingTarget,
} from "@ecommerce/contracts/connectors";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import type { ConnectorSettingsState } from "./useConnectorSettings";

export function ConnectorSettingsFields({ state }: { state: ConnectorSettingsState }) {
  const { settings, statusMap, accountId, setAccountId, setStatus, error } = state;
  return (
    <div className="grid gap-3">
      {!settings && !error && (
        <p className={cn(textClass.meta, "text-muted-foreground")}>Lendo as configurações…</p>
      )}
      {settings && settings.accounts.length > 0 && (
        <div className="grid gap-1">
          <span className={cn(textClass.label, "text-muted-foreground")}>
            Conta ou propriedade usada nos indicadores
          </span>
          <Select value={accountId ?? ""} onValueChange={setAccountId}>
            <SelectTrigger aria-label="Conta">
              <SelectValue placeholder="Escolha" />
            </SelectTrigger>
            <SelectContent>
              {settings.accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      {settings && settings.statuses.length > 0 && (
        <>
          <p className={cn(textClass.meta, "text-muted-foreground")}>
            Diga o que cada situação do ERP significa para os indicadores.
          </p>
          <ul className="divide-y divide-border">
            {settings.statuses.map((status) => (
              <li key={status.id} className="flex items-center justify-between gap-3 py-2">
                <span className={cn(textClass.body, "min-w-0 flex-1 text-foreground")}>
                  {status.label}
                </span>
                <Select
                  value={statusMap[status.id] ?? "PENDING"}
                  onValueChange={(v) => setStatus(status.id, v as StatusMappingTarget)}
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
        </>
      )}
      {settings && settings.statuses.length === 0 && settings.accounts.length === 0 && (
        <p className={cn(textClass.meta, "text-muted-foreground")}>
          A plataforma não devolveu nada para configurar.
        </p>
      )}
      {error && (
        <p role="alert" className={cn(textClass.meta, "text-destructive")}>
          {error}
        </p>
      )}
    </div>
  );
}
