import { describe, expect, it } from "vitest";
import { toQueryString } from "./queryString";

describe("toQueryString", () => {
  it("serializes scalars, repeats arrays and brackets nested objects", () => {
    expect(
      toQueryString({
        inicio: "2026-08-01",
        pagina: 2,
        incluirTaxa: true,
        segmentos: ["campeoes", "leais"],
        total: { min: 10, max: null },
      }),
    ).toBe(
      "?inicio=2026-08-01&pagina=2&incluirTaxa=true&segmentos=campeoes&segmentos=leais&total%5Bmin%5D=10",
    );
  });

  it("skips null and undefined and returns an empty string without params", () => {
    expect(toQueryString({ a: null, b: undefined })).toBe("");
    expect(toQueryString(undefined)).toBe("");
  });
});
