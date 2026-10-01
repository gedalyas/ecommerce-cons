import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";
import type { IntegrationPageSearch } from "@ecommerce/contracts/connections";

export function useIntegrationPageSearch() {
  const search = useSearch({ from: "/integracoes/$chave" });
  const navigate = useNavigate();

  const setTab = useCallback(
    (aba: IntegrationPageSearch["aba"]) => {
      void navigate({
        to: ".",
        search: (prev: Record<string, unknown>) => ({ ...prev, aba }),
        replace: true,
      });
    },
    [navigate],
  );

  return { tab: search.aba, setTab };
}
