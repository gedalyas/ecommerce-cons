import { describe, expect, it } from "vitest";
import type { DataSourceState } from "../connections/connections.types";
import { tabSources } from "./tabSources";

const source = (
  connectorKey: DataSourceState["connectorKey"],
  name: string,
  status: DataSourceState["status"] = "CONNECTED",
  syncLabel = "hoje às 03:12",
): DataSourceState => ({ connectorKey, name, kind: "x", status, syncLabel });

const sources = [
  source("bling", "Bling"),
  source("meta_ads", "Meta Ads"),
  source("google_ads", "Google Ads"),
  source("ga4", "Google Analytics 4"),
  source("instagram", "Instagram"),
  source("tiktok_ads", "TikTok Ads", "NOT_CONNECTED"),
];

const names = (tab: Parameters<typeof tabSources>[0]) =>
  tabSources(tab, sources).map((s) => s.name);

describe("tabSources", () => {
  it("lists the sources each tab reads", () => {
    expect(names("site")).toEqual(["Google Analytics 4"]);
    expect(names("meta")).toEqual(["Meta Ads"]);
    expect(names("google")).toEqual(["Google Ads"]);
    expect(names("geral")).toEqual(["Bling", "Meta Ads", "Google Ads", "Google Analytics 4"]);
    expect(names("social")).toEqual(["Instagram"]);
  });

  it("writes the stamp, flags a source in error and drops the name-only dash", () => {
    expect(tabSources("site", sources)[0]).toEqual({
      name: "Google Analytics 4",
      text: "Google Analytics 4 hoje às 03:12",
      stale: false,
    });
    const [sheet, meta] = tabSources("campanhas", [
      source("manual_csv", "Planilha", "MANUAL", "—"),
      source("meta_ads", "Meta Ads", "ERROR", "há 6 dias"),
    ]);
    expect(sheet).toMatchObject({ text: "Planilha", stale: false });
    expect(meta).toMatchObject({ text: "Meta Ads há 6 dias", stale: true });
  });
});
