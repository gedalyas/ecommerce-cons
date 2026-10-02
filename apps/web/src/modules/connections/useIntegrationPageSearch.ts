import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";
import type { IntegrationPageSearch } from "@ecommerce/contracts/connections";

export function useIntegrationPageSearch() {
  const search = useSearch({ from: "/integracoes/$chave" });
  const navigate = useNavigate();

  const patch = useCallback(
    (next: Partial<IntegrationPageSearch>) => {
      void navigate({
        to: ".",
        search: (prev: Record<string, unknown>) => ({ ...prev, ...next }),
        replace: true,
      });
    },
    [navigate],
  );

  return {
    search,
    setTab: (aba: IntegrationPageSearch["aba"]) => patch({ aba }),
    choose: (conta: string) => patch({ conta, nova: false, aba: "conexao" }),
    startNew: () => patch({ nova: true, conta: "", aba: "conexao" }),
  };
}
