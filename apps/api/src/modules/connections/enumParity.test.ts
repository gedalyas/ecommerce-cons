import { describe, expect, it } from "vitest";
import { dataSourceStatuses } from "@ecommerce/contracts/connectors";
import { DataSourceStatus } from "@ecommerce/database/enums";

describe("connections closed sets", () => {
  it("match the Prisma enums", () => {
    expect([...dataSourceStatuses].sort()).toEqual(Object.values(DataSourceStatus).sort());
  });
});
