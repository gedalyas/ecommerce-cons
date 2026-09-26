import { describe, expect, it } from "vitest";
import { parseImportDate, parseImportNumber } from "@ecommerce/contracts/imports";
import { cellText, sheetTable } from "./sheetCells";

describe("cellText", () => {
  it("writes dates as ISO days the import parser reads", () => {
    const text = cellText(new Date(Date.UTC(2026, 8, 20, 14, 30)));
    expect(text).toBe("2026-09-20");
    expect(parseImportDate(text)).toBe("2026-09-20");
  });

  it("writes numbers without thousands so 1.234,5 never becomes ambiguous", () => {
    expect(cellText(1234.5)).toBe("1234.5");
    expect(parseImportNumber(cellText(1234.5))).toBe(1234.5);
    expect(cellText(Number.NaN)).toBe("");
  });

  it("writes empty, boolean and text cells", () => {
    expect(cellText(null)).toBe("");
    expect(cellText(true)).toBe("sim");
    expect(cellText("  pago ")).toBe("pago");
  });
});

describe("sheetTable", () => {
  it("splits the header and drops blank rows", () => {
    expect(
      sheetTable([
        ["Pedido", "Qtd"],
        ["#1", 2],
        [null, null],
        ["#2", 1],
      ]),
    ).toEqual({
      header: ["Pedido", "Qtd"],
      rows: [
        ["#1", "2"],
        ["#2", "1"],
      ],
    });
  });

  it("drops cells beyond the header's width", () => {
    expect(sheetTable([["Pedido"], ["#1", "x", "y"]]).rows).toEqual([["#1"]]);
  });

  it("is empty for an empty sheet", () => {
    expect(sheetTable([])).toEqual({ header: [], rows: [] });
  });
});
