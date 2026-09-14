import { describe, expect, it } from "vitest";
import { adPlatforms, socialPlatforms } from "@ecommerce/contracts/marketing";
import { AdPlatform, SocialPlatform } from "@ecommerce/database/enums";

describe("marketing closed sets", () => {
  it("match the Prisma enums", () => {
    expect([...adPlatforms].sort()).toEqual(Object.values(AdPlatform).sort());
    expect([...socialPlatforms].sort()).toEqual(Object.values(SocialPlatform).sort());
  });
});
