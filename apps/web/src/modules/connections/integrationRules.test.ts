import { describe, expect, it } from "vitest";
import {
  accountChoices,
  asIntegration,
  integrationStatusOf,
  splitByLink,
  cardStateOf,
  integrationsOf,
  isStoreIntegration,
  nextActive,
  selectedIntegration,
  settingsChanged,
} from "./integrationRules";

const connection = {
  id: "c1",
  name: "Bling",
  accountId: "a1",
  syncLabel: "hoje às 03:00",
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

const matriz = { ...connection, id: "m", name: "ML Matriz", accountId: "a" };
const filial = { ...connection, id: "f", name: "ML Filial", accountId: "b" };

describe("selectedIntegration", () => {
  it("picks the integration in the URL, or the first one", () => {
    expect(selectedIntegration([matriz, filial], { conta: "f", nova: false })).toBe(filial);
    expect(selectedIntegration([matriz, filial], { conta: "", nova: false })).toBe(matriz);
    expect(selectedIntegration([matriz, filial], { conta: "gone", nova: false })).toBe(matriz);
  });

  it("picks none while configuring a new one", () => {
    expect(selectedIntegration([matriz], { conta: "m", nova: true })).toBeNull();
    expect(selectedIntegration([], { conta: "", nova: false })).toBeNull();
  });
});

describe("integrationsOf", () => {
  it("lists one entry per integration and keeps connectors without any", () => {
    const ml = {
      key: "mercado_livre",
      status: "CONNECTED" as const,
      syncLabel: "hoje",
      connection: matriz,
      connections: [matriz, filial],
    };
    const bling = {
      key: "bling",
      status: "NOT_CONNECTED" as const,
      syncLabel: "—",
      connection: null,
      connections: [],
    };
    const list = integrationsOf([ml, bling]);
    expect(list.map((c) => [c.key, c.connection?.name ?? null])).toEqual([
      ["mercado_livre", "ML Matriz"],
      ["mercado_livre", "ML Filial"],
      ["bling", null],
    ]);
  });
});

describe("accountChoices", () => {
  it("offers the platform's accounts and marks those that already have this integration", () => {
    const accounts = [
      { id: "a", family: "mercado_livre" as const, label: "LOJA_A" },
      { id: "b", family: "mercado_livre" as const, label: "LOJA_B" },
      { id: "c", family: "bling" as const, label: "Conta Bling" },
    ];
    expect(accountChoices(accounts, "mercado_livre", [matriz])).toEqual([
      { ...accounts[0], taken: true },
      { ...accounts[1], taken: false },
    ]);
  });
});

describe("asIntegration", () => {
  it("shows the chosen integration's own status and last sync", () => {
    const failing = { ...filial, stage: "ERROR" as const, syncLabel: "ontem" };
    const platform = { status: "CONNECTED" as const, syncLabel: "hoje", connection: matriz };
    expect(asIntegration(platform, failing)).toMatchObject({ status: "ERROR", syncLabel: "ontem" });
    expect(asIntegration(platform, matriz)).toMatchObject({ status: "CONNECTED" });
    expect(asIntegration(platform, null)).toMatchObject({ status: "CONNECTED", connection: null });
  });
});

describe("integrationStatusOf", () => {
  it("reads the integration's stage", () => {
    expect(integrationStatusOf(connection)).toBe("ready");
    expect(integrationStatusOf({ ...connection, stage: "IMPORTING" })).toBe("syncing");
    expect(integrationStatusOf({ ...connection, stage: "ERROR" })).toBe("error");
    expect(integrationStatusOf({ ...connection, stage: "AUTHORIZED", needsAccount: true })).toBe(
      "account",
    );
  });
});

describe("splitByLink", () => {
  it("sets apart sources with no live integration, keeping spreadsheet-fed ones", () => {
    const live = { connection, status: "CONNECTED" as const };
    const lost = { connection: null, status: "ERROR" as const };
    const sheet = { connection: null, status: "MANUAL" as const };
    expect(splitByLink([live, lost, sheet])).toEqual({
      linked: [live, sheet],
      disconnected: [lost],
    });
  });
});
