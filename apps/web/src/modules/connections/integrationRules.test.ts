import { describe, expect, it } from "vitest";
import { cardStateOf, isStoreIntegration, nextActive, settingsChanged } from "./integrationRules";

const connection = {
  id: "c1",
  name: "Bling",
  accountId: "a1",
  stage: "READY" as const,
  externalLabel: "Loja",
  lastSyncAt: null,
  lastError: null,
  needsAccount: false,
};

describe("cardStateOf", () => {
  it("is empty for a connector the store does not use", () => {
    expect(cardStateOf({ kind: "erp", status: "NOT_CONNECTED", connection: null })).toBeNull();
  });

  it("is connected with a connection or a connected source", () => {
    expect(cardStateOf({ kind: "erp", status: "NOT_CONNECTED", connection })).toBe("connected");
    expect(cardStateOf({ kind: "erp", status: "CONNECTED", connection: null })).toBe("connected");
  });

  it("is an error when the source or the last sync failed", () => {
    expect(cardStateOf({ kind: "erp", status: "ERROR", connection: null })).toBe("error");
    expect(
      cardStateOf({
        kind: "erp",
        status: "CONNECTED",
        connection: { ...connection, stage: "ERROR" },
      }),
    ).toBe("error");
  });
});

describe("cardStateOf, spreadsheet", () => {
  it("marks a platform fed by a spreadsheet import", () => {
    expect(cardStateOf({ kind: "paid_media", status: "MANUAL", connection: null })).toBe("manual");
    expect(cardStateOf({ kind: "manual", status: "MANUAL", connection: null })).toBeNull();
  });
});

describe("isStoreIntegration", () => {
  it("keeps connected platforms and leaves the spreadsheet out", () => {
    expect(isStoreIntegration({ kind: "erp", status: "CONNECTED", connection: null })).toBe(true);
    expect(isStoreIntegration({ kind: "manual", status: "MANUAL", connection: null })).toBe(false);
    expect(isStoreIntegration({ kind: "analytics", status: "MANUAL", connection: null })).toBe(
      true,
    );
    expect(isStoreIntegration({ kind: "erp", status: "NOT_CONNECTED", connection: null })).toBe(
      false,
    );
  });
});

describe("settingsChanged", () => {
  const saved = {
    statuses: [],
    statusMap: { "6": "PAID" as const },
    accounts: [{ id: "a", label: "Conta A" }],
    accountId: "a",
  };

  it("is unchanged when the draft matches what was loaded", () => {
    expect(settingsChanged(saved, { statusMap: { "6": "PAID" }, accountId: "a" })).toBe(false);
  });

  it("counts the first account as a change while none was chosen", () => {
    expect(
      settingsChanged(
        { ...saved, accountId: null },
        { statusMap: { "6": "PAID" }, accountId: "a" },
      ),
    ).toBe(true);
  });

  it("notices another account or another status target", () => {
    expect(settingsChanged(saved, { statusMap: { "6": "PAID" }, accountId: "b" })).toBe(true);
    expect(settingsChanged(saved, { statusMap: { "6": "PENDING" }, accountId: "a" })).toBe(true);
  });
});

describe("nextActive", () => {
  it("starts at the first item going down and at the last going up", () => {
    expect(nextActive(-1, 1, 6)).toBe(0);
    expect(nextActive(-1, -1, 6)).toBe(5);
  });

  it("wraps around the list", () => {
    expect(nextActive(5, 1, 6)).toBe(0);
    expect(nextActive(0, -1, 6)).toBe(5);
  });

  it("selects nothing in an empty list", () => {
    expect(nextActive(2, 1, 0)).toBe(-1);
  });
});
