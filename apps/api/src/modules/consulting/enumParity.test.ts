import { describe, expect, it } from "vitest";
import { pillarStatuses } from "@ecommerce/contracts/consulting";
import { fidelities } from "@ecommerce/contracts/shared/fidelity";
import { Fidelity, PillarStatus } from "@ecommerce/database/enums";
import { pillarStatusKey } from "./consultingRows";

describe("consulting closed sets", () => {
  it("map every Prisma pillar status to a contracts key", () => {
    expect(Object.keys(pillarStatusKey).sort()).toEqual(Object.values(PillarStatus).sort());
    expect(Object.values(pillarStatusKey).sort()).toEqual([...pillarStatuses].sort());
  });

  it("share the fidelity seals with Prisma", () => {
    expect([...fidelities].sort()).toEqual(Object.values(Fidelity).sort());
  });
});
