import { describe, expect, it } from "vitest";
import {
  addWidget,
  availableWidgets,
  moveWidget,
  normalizeDashboardLayout,
  removeWidget,
  resizeWidget,
  sameLayout,
} from "./dashboardLayoutRules";
import {
  dashboardWidgetKinds,
  defaultDashboardLayout,
  type DashboardLayout,
} from "./dashboardWidgets";

const layout: DashboardLayout = {
  widgets: [
    { kind: "headline", size: "full" },
    { kind: "bySource", size: "half" },
    { kind: "alerts", size: "full" },
  ],
};

describe("normalizeDashboardLayout", () => {
  it("falls back to the default layout when nothing usable is stored", () => {
    expect(normalizeDashboardLayout(null)).toEqual(defaultDashboardLayout);
    expect(normalizeDashboardLayout({ widgets: [] })).toEqual(defaultDashboardLayout);
    expect(normalizeDashboardLayout({ widgets: [{ kind: "ghost" }] })).toEqual(
      defaultDashboardLayout,
    );
  });

  it("drops unknown kinds and duplicates, and repairs a missing size", () => {
    const stored = {
      widgets: [
        { kind: "bySource", size: "full" },
        { kind: "old", size: "half" },
        { kind: "bySource", size: "half" },
        { kind: "funnel", size: "wide" },
      ],
    };
    expect(normalizeDashboardLayout(stored)).toEqual({
      widgets: [
        { kind: "bySource", size: "full" },
        { kind: "funnel", size: "half" },
      ],
    });
  });
});

describe("layout edits", () => {
  it("lists what is not on the board yet", () => {
    const available = availableWidgets(layout);
    expect(available).not.toContain("headline");
    expect(available).toContain("funnel");
    expect(available.length).toBe(dashboardWidgetKinds.length - 3);
  });

  it("adds at the end with the catalog's default size and never twice", () => {
    const next = addWidget(layout, "funnel");
    expect(next.widgets.at(-1)).toEqual({ kind: "funnel", size: "half" });
    expect(addWidget(next, "funnel")).toBe(next);
  });

  it("removes and resizes by kind", () => {
    expect(removeWidget(layout, "bySource").widgets.map((w) => w.kind)).toEqual([
      "headline",
      "alerts",
    ]);
    expect(resizeWidget(layout, "bySource", "full").widgets[1]).toEqual({
      kind: "bySource",
      size: "full",
    });
  });

  it("moves a widget onto another one's slot", () => {
    expect(moveWidget(layout, "alerts", "headline").widgets.map((w) => w.kind)).toEqual([
      "alerts",
      "headline",
      "bySource",
    ]);
    expect(moveWidget(layout, "headline", "alerts").widgets.map((w) => w.kind)).toEqual([
      "bySource",
      "alerts",
      "headline",
    ]);
    expect(moveWidget(layout, "headline", "headline")).toBe(layout);
  });

  it("compares layouts by order and size", () => {
    expect(sameLayout(layout, { widgets: [...layout.widgets] })).toBe(true);
    expect(sameLayout(layout, resizeWidget(layout, "bySource", "full"))).toBe(false);
    expect(sameLayout(layout, removeWidget(layout, "alerts"))).toBe(false);
  });
});
