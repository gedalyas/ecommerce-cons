import { describe, expect, it } from "vitest";
import { userRoles } from "@ecommerce/contracts/auth";
import { UserRole } from "@ecommerce/database/enums";

describe("auth closed sets", () => {
  it("match the Prisma enums", () => {
    expect([...userRoles].sort()).toEqual(Object.values(UserRole).sort());
  });
});
