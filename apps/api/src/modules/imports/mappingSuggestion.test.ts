import { describe, expect, it } from "vitest";
import {
  mappingOfSuggestion,
  suggestionColumns,
  suggestionFormat,
  suggestionPrompt,
} from "./mappingSuggestion";

const header = ["Dia", "Fonte", "Meio", "Visitas", "", "dia "];

describe("suggestionColumns", () => {
  it("names each distinct column by its position", () => {
    expect(suggestionColumns(header)).toEqual([
      { id: "c0", name: "Dia" },
      { id: "c1", name: "Fonte" },
      { id: "c2", name: "Meio" },
      { id: "c3", name: "Visitas" },
    ]);
  });
});

describe("suggestionFormat", () => {
  it("limits the answer to the template's fields and the column ids", () => {
    const format = suggestionFormat("TRAFFIC", suggestionColumns(header));
    const item = format.schema.properties.columns.items.properties;
    expect(item.field.enum).toContain("sessions");
    expect(item.column.enum).toEqual(["c0", "c1", "c2", "c3"]);
  });
});

describe("suggestionPrompt", () => {
  it("lists the fields and carries the columns and the sample", () => {
    const prompt = suggestionPrompt("TRAFFIC", suggestionColumns(header), [
      ["05/09/2026", "google", "cpc", "10"],
    ]);
    expect(prompt).toContain('- sessions ("sessoes", integer, required');
    expect(prompt).toContain('{"id":"c3","name":"Visitas"}');
    expect(prompt).toContain('"rows":[["05/09/2026","google","cpc","10"]]');
  });
});

describe("mappingOfSuggestion", () => {
  it("turns ids back into the file's columns, dropping invented fields, ids and reuse", () => {
    expect(
      mappingOfSuggestion("TRAFFIC", header, {
        columns: [
          { field: "date", column: "c0" },
          { field: "source", column: "c1" },
          { field: "medium", column: "c1" },
          { field: "sessions", column: "c9" },
          { field: "users", column: "c5" },
          { field: "bogus", column: "c2" },
          { field: "date", column: "c2" },
        ],
      }),
    ).toEqual({ date: "Dia", source: "Fonte" });
  });

  it("is empty for an answer out of shape", () => {
    expect(mappingOfSuggestion("TRAFFIC", header, { columns: "nope" })).toEqual({});
    expect(mappingOfSuggestion("TRAFFIC", header, null)).toEqual({});
  });
});
