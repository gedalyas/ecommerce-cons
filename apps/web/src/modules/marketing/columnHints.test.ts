import { describe, expect, it } from "vitest";
import type { DataTableColumn } from "@/shared/ui/DataTable";
import { withHints } from "./columnHints";

type Row = { spend: number; name: string };

const columns: DataTableColumn<Row>[] = [
  { key: "name", header: "Nome", render: (r) => r.name },
  { key: "spend", header: "Investimento", render: (r) => r.spend },
];

describe("withHints", () => {
  it("puts the glossary explanation on the columns that name a term", () => {
    const [name, spend] = withHints(columns, { spend: "adSpend" });
    expect(name).not.toHaveProperty("hint");
    expect(spend?.hint?.formula).toBeTruthy();
  });

  it("leaves a term the glossary does not know without explanation", () => {
    expect(withHints(columns, { spend: "unknown" })[1]?.hint).toBeNull();
  });
});
