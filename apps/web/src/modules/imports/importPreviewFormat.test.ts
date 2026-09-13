import { describe, expect, it } from "vitest";
import { previewCell, previewSummaryText } from "./importPreviewFormat";

describe("previewCell", () => {
  it("formats by column type and shows a dash for nothing", () => {
    expect(previewCell(1234.5, "currency")).toBe("R$\u00a01.234,50");
    expect(previewCell(1234, "integer")).toBe("1.234");
    expect(previewCell("2026-09-05", "date")).toBe("05/09");
    expect(previewCell("Ana", "text")).toBe("Ana");
    expect(previewCell(null, "text")).toBe("—");
    expect(previewCell("", "text")).toBe("—");
  });
});

describe("previewSummaryText", () => {
  it("adds the period when known", () => {
    expect(
      previewSummaryText({ count: 12, label: "pedidos", from: "2026-09-01", to: "2026-09-10" }),
    ).toBe("12 pedidos · 01/09 a 10/09");
    expect(previewSummaryText({ count: 0, label: "pedidos", from: null, to: null })).toBe(
      "0 pedidos",
    );
  });
});
