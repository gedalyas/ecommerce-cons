import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";
import type { PeriodSearch } from "@/shared/utils/period";
import type { MarketingSearch } from "./marketingSchema";

/** Reads and patches the `/marketing` search params. */
export function useMarketingSearch() {
  const search = useSearch({ from: "/marketing" }) as PeriodSearch & MarketingSearch;
  const navigate = useNavigate();

  const patch = useCallback(
    (next: Partial<MarketingSearch>) => {
      void navigate({
        to: "/marketing",
        search: (prev: Record<string, unknown>) => ({ ...prev, ...next }),
        replace: true,
      });
    },
    [navigate],
  );

  return { search, patch };
}
