import { describe, expect, it } from "vitest";
import type { DataTableColumn } from "./dataTable.types";
import { mobileColumnsOf, nextSortOf, sortRows } from "./dataTableRules";

type Row = { name: string; total: number; items: number; email: string };

const column = (
  key: keyof Row,
  extra: Partial<DataTableColumn<Row>> = {},
): DataTableColumn<Row> => ({
  key,
  header: key,
  render: (row) => String(row[key]),
  ...extra,
});

describe("mobileColumnsOf", () => {
  it("uses the first column as the title and the first numeric column as the lead", () => {
    const columns = [
      column("name"),
      column("email"),
      column("total", { align: "right" }),
      column("items", { align: "right" }),
    ];
    const mobile = mobileColumnsOf(columns);
    expect(mobile.title?.key).toBe("name");
    expect(mobile.lead?.key).toBe("total");
    expect(mobile.details.map((c) => c.key)).toEqual(["email", "items"]);
  });

  it("honours explicit hints and drops hidden columns", () => {
    const columns = [
      column("email", { mobile: "hidden" }),
      column("items", { align: "right", mobile: "lead" }),
      column("name", { mobile: "title" }),
      column("total", { align: "right" }),
    ];
    const mobile = mobileColumnsOf(columns);
    expect(mobile.title?.key).toBe("name");
    expect(mobile.lead?.key).toBe("items");
    expect(mobile.details.map((c) => c.key)).toEqual(["total"]);
  });

  it("has no lead when every column is text", () => {
    const mobile = mobileColumnsOf([column("name"), column("email")]);
    expect(mobile.title?.key).toBe("name");
    expect(mobile.lead).toBeNull();
    expect(mobile.details.map((c) => c.key)).toEqual(["email"]);
  });

  it("keeps unlabelled columns as actions, never as title or lead", () => {
    const actions = column("items", { header: "", align: "right" });
    const mobile = mobileColumnsOf([actions, column("name"), column("total", { align: "right" })]);
    expect(mobile.title?.key).toBe("name");
    expect(mobile.lead?.key).toBe("total");
    expect(mobile.actions).toEqual([actions]);
    expect(mobile.details).toEqual([]);
  });

  it("never uses the title column as the lead", () => {
    const mobile = mobileColumnsOf([column("total", { align: "right" }), column("name")]);
    expect(mobile.title?.key).toBe("total");
    expect(mobile.lead).toBeNull();
  });
});

describe("nextSortOf", () => {
  it("starts descending on a new column", () => {
    expect(nextSortOf("total", null)).toEqual({ key: "total", direction: "desc" });
    expect(nextSortOf("total", { key: "name", direction: "asc" })).toEqual({
      key: "total",
      direction: "desc",
    });
  });

  it("flips the direction on the same column", () => {
    expect(nextSortOf("total", { key: "total", direction: "desc" })).toEqual({
      key: "total",
      direction: "asc",
    });
    expect(nextSortOf("total", { key: "total", direction: "asc" })).toEqual({
      key: "total",
      direction: "desc",
    });
  });
});

describe("sortRows", () => {
  const rows: Row[] = [
    { name: "b", total: 2, items: 1, email: "" },
    { name: "a", total: 3, items: 1, email: "" },
    { name: "c", total: 1, items: 1, email: "" },
  ];
  const columns = [
    column("name", { sortValue: (r) => r.name }),
    column("total", { sortValue: (r) => r.total }),
    column("email"),
  ];

  it("returns the rows untouched without a sort or on a column that cannot sort", () => {
    expect(sortRows(rows, columns, null)).toBe(rows);
    expect(sortRows(rows, columns, { key: "email", direction: "asc" })).toBe(rows);
  });

  it("sorts numbers and strings in both directions", () => {
    expect(
      sortRows(rows, columns, { key: "total", direction: "desc" }).map((r) => r.total),
    ).toEqual([3, 2, 1]);
    expect(sortRows(rows, columns, { key: "name", direction: "asc" }).map((r) => r.name)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("sorts null values as the largest ones", () => {
    const withNull: Row[] = [...rows, { name: "d", total: 0, items: 1, email: "" }];
    const cols = [column("total", { sortValue: (r) => (r.total === 0 ? null : r.total) })];
    const names = (direction: "asc" | "desc") =>
      sortRows(withNull, cols, { key: "total", direction }).map((r) => r.name);
    expect(names("asc")).toEqual(["c", "b", "a", "d"]);
    expect(names("desc")).toEqual(["d", "a", "b", "c"]);
  });
});
