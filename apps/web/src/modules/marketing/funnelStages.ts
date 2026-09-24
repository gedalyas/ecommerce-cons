import type { StageSpend } from "@ecommerce/contracts/marketing";

export const visibleStages = (stages: readonly StageSpend[]): StageSpend[] =>
  stages.filter((s) => s.stage !== "UNTAGGED" || (s.spend.value ?? 0) > 0);
