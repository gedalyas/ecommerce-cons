import { describe, expect, it } from "vitest";
import { influencerRuleTypes, influencerStatuses } from "@ecommerce/contracts/influencers";
import { InfluencerRuleType, InfluencerStatus } from "@ecommerce/database/enums";

describe("influencer closed sets", () => {
  it("match the Prisma enums", () => {
    expect([...influencerStatuses].sort()).toEqual(Object.values(InfluencerStatus).sort());
    expect([...influencerRuleTypes].sort()).toEqual(Object.values(InfluencerRuleType).sort());
  });
});
