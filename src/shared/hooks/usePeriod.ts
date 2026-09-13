import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback } from "react";
import { resolveComparison, type PeriodSearch } from "@/shared/utils/period";

/**
 * Reads and updates the global period (`?inicio=&fim=&por=&comparar=`).
 * The root route validates the params, so every screen sees the same values.
 */
export function usePeriod() {
  const period = useSearch({ from: "__root__" }) as PeriodSearch;
  const navigate = useNavigate();

  const setPeriod = useCallback(
    (patch: Partial<PeriodSearch>) => {
      void navigate({
        to: ".",
        search: (prev: Record<string, unknown>) => ({ ...prev, ...patch }),
        replace: true,
      });
    },
    [navigate],
  );

  return { period, setPeriod, comparison: resolveComparison(period) };
}
