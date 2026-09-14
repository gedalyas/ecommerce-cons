import { describe, expect, it } from "vitest";
import { accountIdOf, needsAccountOf, reconnectSettings } from "./connectionSettings";

describe("needsAccountOf", () => {
  it("is true only when the settings carry an accountId that is still null", () => {
    expect(needsAccountOf({ accountId: null })).toBe(true);
    expect(needsAccountOf({ accountId: "act_1" })).toBe(false);
    expect(needsAccountOf({ statusMap: {} })).toBe(false);
    expect(needsAccountOf(null)).toBe(false);
    expect(needsAccountOf([])).toBe(false);
  });
});

describe("reconnectSettings", () => {
  it("keeps the account the client already chose when the platform offers the choice again", () => {
    expect(reconnectSettings({ accountId: null }, { accountId: "act_2", statusMap: {} })).toEqual({
      accountId: "act_2",
    });
  });

  it("takes the fresh choice when the provider resolved it or nothing was stored", () => {
    expect(reconnectSettings({ accountId: "act_9" }, { accountId: "act_2" })).toEqual({
      accountId: "act_9",
    });
    expect(reconnectSettings({ accountId: null }, null)).toEqual({ accountId: null });
    expect(reconnectSettings(null, { accountId: "act_2" })).toBeNull();
    expect(accountIdOf({ accountId: 5 })).toBeNull();
  });
});
