import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import type { CustomersSearch } from "@ecommerce/contracts/customers";

/** Reads and patches the `/clientes` search params; filter changes reset the page. */
export function useCustomersSearch() {
  const search = useSearch({ from: "/clientes" }) as PeriodSearch & CustomersSearch;
  const navigate = useNavigate();

  const patch = useCallback(
    (next: Partial<CustomersSearch>) => {
      const resetsPage = Object.keys(next).some((k) => k !== "pagina" && k !== "porPagina");
      void navigate({
        to: "/clientes",
        search: (prev: Record<string, unknown>) => ({
          ...prev,
          ...(resetsPage ? { pagina: 1 } : {}),
          ...next,
        }),
        replace: true,
      });
    },
    [navigate],
  );

  return { search, patch };
}
