import { describe, expect, it } from "vitest";
import { toRegionRows } from "./regionRows";

const row = (key: string, paid: number) => ({
  key,
  label: key,
  province: key,
  paid,
  captured: paid * 1.1,
  paid_orders: 10,
  captured_orders: 12,
  customers: 9,
  items: 18,
  discounts: 50,
});

describe("toRegionRows", () => {
  it("derives share, approval, ticket and per-order ratios", () => {
    const [sp, rj] = toRegionRows([row("SP", 3000), row("RJ", 1000)]);
    expect(sp!.paidShare).toBe(75);
    expect(rj!.paidShare).toBe(25);
    expect(sp!.approvalRate).toBeCloseTo(0.8333, 4);
    expect(sp!.averageTicket).toBe(300);
    expect(sp!.itemsPerOrder).toBe(1.8);
    expect(sp!.discountPerOrder).toBe(5);
  });

  it("is null-safe on an empty region", () => {
    const [r] = toRegionRows([{ ...row("AC", 0), paid_orders: 0, captured_orders: 0 }]);
    expect(r!.approvalRate).toBeNull();
    expect(r!.averageTicket).toBeNull();
    expect(r!.paidShare).toBe(0);
  });
});
