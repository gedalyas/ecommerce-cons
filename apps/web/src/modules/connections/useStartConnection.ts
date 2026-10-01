import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import type { StoreConnector } from "@ecommerce/contracts/connectors";
import { startConnectorFn } from "./connectionsController";

export function useStartConnection(connector: StoreConnector | null) {
  const start = useServerFn(startConnectorFn);
  const [domain, setDomain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const needsDomain = connector?.authPattern === "domain_oauth";

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

  return {
    domain,
    setDomain,
    busy,
    error,
    needsDomain,
    canSubmit: !busy && !(needsDomain && !domain.trim()),
    submit,
  };
}
