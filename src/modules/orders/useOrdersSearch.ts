import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";
import type { PeriodSearch } from "@/shared/utils/period";
import type { OrdersSearch } from "./ordersSchema";

/**
 * Reads and patches the `/pedidos` search params (tab, filters, paging) on
 * top of the global period. Filter changes reset the page to 1.
 */
export function useOrdersSearch() {
  const search = useSearch({ from: "/pedidos" }) as PeriodSearch & OrdersSearch;
  const navigate = useNavigate();

  const patch = useCallback(
    (next: Partial<OrdersSearch>) => {
      const resetsPage = Object.keys(next).some((k) => k !== "pagina" && k !== "porPagina");
      void navigate({
        to: "/pedidos",
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
