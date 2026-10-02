import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import type { StoreConnector } from "@ecommerce/contracts/connectors";
import { Button } from "@/shared/ui/Button";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/Select";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { OAuthOnboarding } from "./ConnectionPanel";
import { createIntegrationFn } from "./connectionsController";
import { asIntegration, type AccountChoice } from "./integrationRules";

const NEW_ACCOUNT = "nova-conta";
const MAX_NAME = 60;

type Props = {
  connector: StoreConnector;
  choices: AccountChoice[];
  onCreated: (id: string) => void;
};

function ExistingAccount({
  connector,
  accountId,
  name,
  onCreated,
}: {
  connector: StoreConnector;
  accountId: string;
  name: string;
  onCreated: (id: string) => void;
}) {
  const create = useServerFn(createIntegrationFn);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    setBusy(true);
    setError(null);
    const result = await create({ data: { key: connector.key, accountId, name } });
    setBusy(false);
    if (!result.ok) return setError(result.message);
    onCreated(result.value.id);
  };
  return (
    <div className="flex flex-col gap-3">
      <p className={cn(textClass.body, "text-foreground")}>
        A nova integração usa o login dessa conta: não é preciso entrar de novo em {connector.label}
        .
      </p>
      {error && (
        <p role="alert" className={cn(textClass.meta, "text-destructive")}>
          {error}
        </p>
      )}
      <Button className="h-11 w-full" disabled={busy || name === ""} onClick={() => void submit()}>
        {busy ? "Criando…" : "Criar integração"}
      </Button>
    </div>
  );
}

export function NewIntegrationPanel({ connector, choices, onCreated }: Props) {
  const [name, setName] = useState("");
  const free = choices.find((c) => !c.taken);
  const [account, setAccount] = useState(free?.id ?? NEW_ACCOUNT);
  const trimmed = name.trim();
  return (
    <div className="flex flex-col gap-5">
      <FormField label="Nome da integração *" hint="Ex.: Matriz, Filial, Loja SP.">
        <Input
          value={name}
          maxLength={MAX_NAME}
          onChange={(e) => setName(e.target.value)}
          placeholder={`${connector.label} Filial`}
        />
      </FormField>
      {choices.length > 0 && (
        <FormField label="Conta">
          <Select value={account} onValueChange={setAccount}>
            <SelectTrigger aria-label="Conta">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {choices.map((c) => (
                <SelectItem key={c.id} value={c.id} disabled={c.taken}>
                  {c.label}
                  {c.taken ? " (já tem esta integração)" : ""}
                </SelectItem>
              ))}
              <SelectItem value={NEW_ACCOUNT}>Conectar outra conta</SelectItem>
            </SelectContent>
          </Select>
        </FormField>
      )}
      {account === NEW_ACCOUNT ? (
        <OAuthOnboarding connector={asIntegration(connector, null)} name={trimmed} />
      ) : (
        <ExistingAccount
          connector={connector}
          accountId={account}
          name={trimmed}
          onCreated={onCreated}
        />
      )}
    </div>
  );
}
