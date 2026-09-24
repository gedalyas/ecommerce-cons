import { describe, expect, it } from "vitest";
import type { StageSpend } from "@ecommerce/contracts/marketing";
import { visibleStages } from "./funnelStages";

const stage = (key: StageSpend["stage"], value: number): StageSpend => ({
  stage: key,
  spend: { value, unit: "currency", previous: null, variation: null },
  share: null,
  byPlatform: [],
});

describe("visibleStages", () => {
  it("always shows the three stages and shows Sem etapa only when it has investment", () => {
    const stages = [stage("TOP", 10), stage("MIDDLE", 0), stage("BOTTOM", 5)];
    expect(visibleStages([...stages, stage("UNTAGGED", 0)]).map((s) => s.stage)).toEqual([
      "TOP",
      "MIDDLE",
      "BOTTOM",
    ]);
    expect(visibleStages([...stages, stage("UNTAGGED", 3)])).toHaveLength(4);
  });
});
