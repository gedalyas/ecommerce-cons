import { describe, expect, it } from "vitest";
import { fulfillments } from "@ecommerce/contracts/orders";
import { Fulfillment } from "@ecommerce/database/enums";

describe("orders enums match the contracts", () => {
  it("Fulfillment", () => {
    expect([...fulfillments].sort()).toEqual(Object.values(Fulfillment).sort());
  });
});
