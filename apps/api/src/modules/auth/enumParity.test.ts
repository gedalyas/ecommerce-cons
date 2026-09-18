import { describe, expect, it } from "vitest";
import { accessAreas, clientMemberships, userRoles } from "@ecommerce/contracts/auth";
import { AccessArea, ClientMembership, UserRole } from "@ecommerce/database/enums";

describe("auth closed sets", () => {
  it("match the Prisma enums", () => {
    expect([...userRoles].sort()).toEqual(Object.values(UserRole).sort());
    expect([...clientMemberships].sort()).toEqual(Object.values(ClientMembership).sort());
    expect([...accessAreas].sort()).toEqual(Object.values(AccessArea).sort());
  });
});
