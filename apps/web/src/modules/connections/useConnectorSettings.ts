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

function useLoadedSettings(key: ConnectorKey | null) {
  const load = useServerFn(getConnectorSettings);
  const [settings, setSettings] = useState<ConnectorSettings | null>(null);
  const [draft, setDraft] = useState<Draft>({ statusMap: {}, accountId: null });
  const [initialAccountId, setInitialAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!key) return;
    setSettings(null);
    setError(null);
    void load({ data: { key } })
      .then((loaded) => {
        const first = loaded.accountId ?? loaded.accounts[0]?.id ?? null;
        setSettings(loaded);
        setDraft({ statusMap: loaded.statusMap, accountId: first });
        setInitialAccountId(first);
      })
      .catch(() => setError("Não foi possível ler as configurações da plataforma."));
  }, [key, load]);

  const markSaved = (saved: Draft) => {
    setSettings((prev) => (prev ? { ...prev, ...saved } : prev));
    setInitialAccountId(saved.accountId);
  };

  return { settings, draft, setDraft, initialAccountId, error, setError, markSaved };
}

export function useConnectorSettings(connector: StoreConnector | null) {
  const key = connector?.key ?? null;
  const loaded = useLoadedSettings(key);
  const save = useServerFn(saveConnectorSettingsFn);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const { settings, draft, setDraft, initialAccountId } = loaded;

  const submit = async (): Promise<boolean> => {
    if (!key) return false;
    setBusy(true);
    loaded.setError(null);
    const result = await save({ data: { key, ...draft } });
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
