import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";
import type { IntegrationsSearch } from "@ecommerce/contracts/connections";

export function useIntegrationsSearch() {
  const search = useSearch({ from: "/integracoes" });
  const navigate = useNavigate();

  const patch = useCallback(
    (next: Partial<IntegrationsSearch>) => {
      void navigate({
        to: "/integracoes",
        search: (prev: Record<string, unknown>) => ({ ...prev, ...next }),
        replace: true,
      });
    },
    [navigate],
  );

  return { search, patch };
}
