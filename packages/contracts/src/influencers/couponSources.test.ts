import { describe, expect, it } from "vitest";
import { couponSourceNotice, influencersEmptyMessage } from "./couponSources";

describe("couponSourceNotice", () => {
  it("warns when the sales come from a source without coupons", () => {
    expect(couponSourceNotice("bling")).toMatch(/Bling, que não informa o cupom/);
    expect(couponSourceNotice("amazon_fba_classic")).toMatch(/não informa o cupom/);
  });

  it("stays quiet for sources that carry the coupon or no source at all", () => {
    expect(couponSourceNotice("shopify")).toBeNull();
    expect(couponSourceNotice("manual_csv")).toBeNull();
    expect(couponSourceNotice(null)).toBeNull();
  });
});

describe("influencersEmptyMessage", () => {
  it("invites the first registration on an empty store", () => {
    expect(influencersEmptyMessage(0)).toMatch(/Cadastre o primeiro/);
    expect(influencersEmptyMessage(3)).toBe("Nenhum influenciador neste status.");
  });
});
