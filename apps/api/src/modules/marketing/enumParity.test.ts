import { describe, expect, it } from "vitest";
import {
  adPlatforms,
  audienceDimensions,
  funnelStages,
  socialPlatforms,
} from "@ecommerce/contracts/marketing";
import {
  AdPlatform,
  AudienceDimension,
  FunnelStage,
  SocialPlatform,
} from "@ecommerce/database/enums";

describe("marketing closed sets", () => {
  it("match the Prisma enums", () => {
    expect([...adPlatforms].sort()).toEqual(Object.values(AdPlatform).sort());
    expect([...socialPlatforms].sort()).toEqual(Object.values(SocialPlatform).sort());
    expect([...funnelStages].sort()).toEqual(Object.values(FunnelStage).sort());
    expect([...audienceDimensions].sort()).toEqual(Object.values(AudienceDimension).sort());
  });
});
