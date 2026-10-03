import { describe, expect, it } from "vitest";
import {
  canUseTool,
  isAssistantTool,
  toolCallKey,
  toolPeriodOf,
  toolSearchOf,
  toolsFor,
  visibleSections,
} from "./assistantTools";

const selected = { inicio: "2026-09-01", fim: "2026-09-30" };

describe("canUseTool", () => {
  it("gives the owner and staff every tool on a released store", () => {
    expect(canUseTool("money_results", null, null)).toBe(true);
  });

  it("needs the area granted to a team member", () => {
    const marketingOnly = [{ area: "MARKETING", level: "view" }] as const;
    expect(canUseTool("marketing_channels", marketingOnly, null)).toBe(true);
    expect(canUseTool("money_results", marketingOnly, null)).toBe(false);
    expect(canUseTool("store_overview", marketingOnly, null)).toBe(true);
  });

  it("needs the screen released to the store", () => {
    expect(canUseTool("goals_progress", null, ["MARKETING", "ORDERS"])).toBe(false);
    expect(canUseTool("marketing_channels", null, ["MARKETING", "ORDERS"])).toBe(true);
  });
});

describe("toolsFor", () => {
  it("offers only the tools the user may use", () => {
    const names = toolsFor([{ area: "DATA", level: "view" }], null).map((t) => t.name);
    expect(names).toEqual([
      "store_overview",
      "data_sources",
      "products_sales",
      "customers_retention",
      "consultant_plan",
    ]);
  });
});

describe("isAssistantTool", () => {
  it("recognises the tool names", () => {
    expect(isAssistantTool("money_results")).toBe(true);
    expect(isAssistantTool("delete_store")).toBe(false);
  });
});

describe("toolPeriodOf", () => {
  it("defaults to the period the user selected", () => {
    expect(toolPeriodOf({}, selected)).toEqual({ ok: true, period: selected });
    expect(toolPeriodOf(undefined, selected)).toEqual({ ok: true, period: selected });
  });

  it("takes the period the question names", () => {
    expect(toolPeriodOf({ inicio: "2026-08-01", fim: "2026-08-31" }, selected)).toEqual({
      ok: true,
      period: { inicio: "2026-08-01", fim: "2026-08-31" },
    });
  });

  it("refuses malformed, reversed and too long periods", () => {
    expect(toolPeriodOf({ inicio: "agosto" }, selected).ok).toBe(false);
    expect(toolPeriodOf({ fim: "2026-13-01" }, selected).ok).toBe(false);
    expect(toolPeriodOf({ inicio: "2026-02-30" }, selected).ok).toBe(false);
    expect(toolPeriodOf({ inicio: "2026-10-05" }, selected).ok).toBe(false);
    expect(toolPeriodOf({ inicio: "2024-01-01" }, selected).ok).toBe(false);
  });
});

describe("toolSearchOf", () => {
  it("reads the period as a whole against the previous one, on the selected channel", () => {
    expect(toolSearchOf(selected, "marketplace")).toEqual({
      ...selected,
      por: "mes",
      comparar: "periodo-anterior",
      canal: "marketplace",
    });
  });
});

describe("toolCallKey", () => {
  it("tells a repeated lookup apart from a new period", () => {
    const august = { inicio: "2026-08-01", fim: "2026-08-31" };
    expect(toolCallKey("money_results", selected)).toBe(toolCallKey("money_results", selected));
    expect(toolCallKey("money_results", selected)).not.toBe(toolCallKey("money_results", august));
    expect(toolCallKey("money_results", selected)).not.toBe(
      toolCallKey("store_overview", selected),
    );
  });

  it("reads the consultant's plan once whatever period is asked", () => {
    expect(toolCallKey("consultant_plan", selected)).toBe("consultant_plan");
  });

  it("reads the sources once whatever period is asked", () => {
    expect(toolCallKey("data_sources", selected)).toBe(
      toolCallKey("data_sources", { inicio: "2026-01-01", fim: "2026-01-31" }),
    );
  });
});

describe("visibleSections", () => {
  it("shows the owner and staff every consulting area of a fully released store", () => {
    expect(visibleSections(null, null)).toEqual(["money", "marketing", "logistics", "management"]);
  });

  it("keeps a member to the areas granted and the screens released", () => {
    expect(visibleSections([{ area: "MARKETING", level: "view" }], null)).toEqual(["marketing"]);
    expect(visibleSections(null, ["MARKETING", "ORDERS"])).toEqual(["marketing"]);
  });
});
