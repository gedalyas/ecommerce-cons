import type { PeriodSearch } from "@/shared/utils/period";

export type PeriodSelectorProps = {
  value: PeriodSearch;
  onChange: (patch: Partial<PeriodSearch>) => void;
  /** ISO date; no day after it can be picked. Defaults to the reference "today". */
  today?: string;
  className?: string;
};
