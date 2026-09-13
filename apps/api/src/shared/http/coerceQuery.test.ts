import { describe, expect, it } from "vitest";
import { z } from "zod";
import { coerceQuery } from "./coerceQuery";

const schema = z.object({
  pagina: z.number().int().catch(1),
  incluirTaxa: z.boolean().catch(false),
  busca: z.string().catch(""),
  segmentos: z.array(z.string()).catch([]),
  total: z.object({ min: z.number().nullable(), max: z.number().nullable() }).optional(),
  ordem: z.enum(["asc", "desc"]).catch("desc"),
  uf: z.union([z.string(), z.null()]).catch(null),
});

describe("coerceQuery", () => {
  it("turns query strings into the types the schema expects", () => {
    const parsed = schema.parse(
      coerceQuery(schema, {
        pagina: "3",
        incluirTaxa: "true",
        busca: "10",
        segmentos: "campeoes",
        total: { min: "10", max: "" },
        ordem: "asc",
      }),
    );
    expect(parsed).toEqual({
      pagina: 3,
      incluirTaxa: true,
      busca: "10",
      segmentos: ["campeoes"],
      total: { min: 10, max: null },
      ordem: "asc",
      uf: null,
    });
  });

  it("keeps repeated keys as arrays and leaves unknown keys alone", () => {
    const result = coerceQuery(schema, { segmentos: ["a", "b"], other: "x" });
    expect(result["segmentos"]).toEqual(["a", "b"]);
    expect(result["other"]).toBe("x");
  });

  it("resolves the null literal of a union", () => {
    expect(coerceQuery(schema, { uf: "null" })["uf"]).toBeNull();
    expect(coerceQuery(schema, { uf: "SP" })["uf"]).toBe("SP");
  });
});
