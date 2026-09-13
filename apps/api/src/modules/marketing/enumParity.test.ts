import { describe, expect, it } from "vitest";
import { adPlatforms } from "@ecommerce/contracts/marketing";
import { AdPlatform } from "@ecommerce/database/enums";

describe("marketing closed sets", () => {
  it("match the Prisma enums", () => {
    expect([...adPlatforms].sort()).toEqual(Object.values(AdPlatform).sort());
  });
});
