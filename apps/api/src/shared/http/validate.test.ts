import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ValidationError } from "./httpError";
import { fieldErrorsOf, parseOrThrow } from "./validate";

const schema = z.object({ email: z.string().email("E-mail inválido"), age: z.number().min(18) });

describe("parseOrThrow", () => {
  it("returns the parsed value", () => {
    expect(parseOrThrow(schema, { email: "a@b.co", age: 20 })).toEqual({
      email: "a@b.co",
      age: 20,
    });
  });

  it("throws a 422 with the errors keyed by field", () => {
    try {
      parseOrThrow(schema, { email: "nope", age: 3 });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).status).toBe(422);
      expect((error as ValidationError).errors).toEqual({
        email: ["E-mail inválido"],
        age: [expect.any(String)],
      });
    }
  });
});

describe("fieldErrorsOf", () => {
  it("uses _ for issues without a path", () => {
    const result = z.string().safeParse(5);
    expect(result.success).toBe(false);
    if (!result.success) expect(Object.keys(fieldErrorsOf(result.error))).toEqual(["_"]);
  });
});
