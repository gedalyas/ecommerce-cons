import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import type {
  ConnectorKey,
  ConnectorSettings,
  StatusMappingTarget,
  StoreConnector,
} from "@ecommerce/contracts/connectors";
import { getConnectorSettings, saveConnectorSettingsFn } from "./connectionsController";
import { settingsChanged } from "./integrationRules";

type Draft = Pick<ConnectorSettings, "statusMap" | "accountId">;

type Target = { key: ConnectorKey; id: string };

function useLoadedSettings(target: Target | null) {
  const load = useServerFn(getConnectorSettings);
  const [settings, setSettings] = useState<ConnectorSettings | null>(null);
  const [draft, setDraft] = useState<Draft>({ statusMap: {}, accountId: null });
  const [initialAccountId, setInitialAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const key = target?.key ?? null;
  const id = target?.id ?? null;

  useEffect(() => {
    if (!key || !id) return;
    setSettings(null);
    setError(null);
    void load({ data: { key, id } })
      .then((loaded) => {
        const first = loaded.accountId ?? loaded.accounts[0]?.id ?? null;
        setSettings(loaded);
        setDraft({ statusMap: loaded.statusMap, accountId: first });
        setInitialAccountId(first);
      })
      .catch(() => setError("Não foi possível ler as configurações da plataforma."));
  }, [key, id, load]);

  const markSaved = (saved: Draft) => {
    setSettings((prev) => (prev ? { ...prev, ...saved } : prev));
    setInitialAccountId(saved.accountId);
  };

  return { settings, draft, setDraft, initialAccountId, error, setError, markSaved };
}

export function useConnectorSettings(connector: StoreConnector | null) {
  const target =
    connector?.connection != null ? { key: connector.key, id: connector.connection.id } : null;
  const loaded = useLoadedSettings(target);
  const save = useServerFn(saveConnectorSettingsFn);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { settings, draft, setDraft, initialAccountId } = loaded;

  const submit = async (): Promise<boolean> => {
    if (!target) return false;
    setBusy(true);
    loaded.setError(null);
    const result = await save({ data: { ...target, ...draft } });
    setBusy(false);
    if (!result.ok) {
      loaded.setError(result.message);
      return false;
    }
    loaded.markSaved(draft);
    await router.invalidate();
    return true;
  };

  return {
    settings,
    statusMap: draft.statusMap,
    accountId: draft.accountId,
    setAccountId: (accountId: string | null) => setDraft((prev) => ({ ...prev, accountId })),
    setStatus: (id: string, target: StatusMappingTarget) =>
      setDraft((prev) => ({ ...prev, statusMap: { ...prev.statusMap, [id]: target } })),
    busy,
    error: loaded.error,
    dirty: settings !== null && settingsChanged(settings, draft),
    edited:
      settings !== null && settingsChanged({ ...settings, accountId: initialAccountId }, draft),
    submit,
  };
}

export type ConnectorSettingsState = ReturnType<typeof useConnectorSettings>;
