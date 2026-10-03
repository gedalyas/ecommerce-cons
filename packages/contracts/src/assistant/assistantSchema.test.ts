import { describe, expect, it } from "vitest";
import { assistantRequestSchema } from "./assistantSchema";

const base = {
  messages: [{ role: "user", text: "Quanto vendi?" }],
  inicio: "2026-09-01",
  fim: "2026-09-30",
};

describe("assistantRequestSchema", () => {
  it("accepts a question with the selected period and defaults the rest", () => {
    expect(assistantRequestSchema.parse(base)).toEqual({ ...base, canal: "todos", screen: null });
  });

  it("asks for the last message to be the user's question", () => {
    const answered = {
      ...base,
      messages: [...base.messages, { role: "assistant", text: "R$ 10" }],
    };
    expect(assistantRequestSchema.safeParse(answered).success).toBe(false);
  });

  it("refuses blank, oversized and overlong conversations", () => {
    const blank = { ...base, messages: [{ role: "user", text: "   " }] };
    const long = { ...base, messages: [{ role: "user", text: "a".repeat(2001) }] };
    const many = {
      ...base,
      messages: Array.from({ length: 13 }, (_, i) => ({
        role: i % 2 === 0 ? "user" : "assistant",
        text: "oi",
      })),
    };
    for (const input of [blank, long, many]) {
      expect(assistantRequestSchema.safeParse(input).success).toBe(false);
    }
  });

  it("keeps the period ordered and within a year", () => {
    expect(assistantRequestSchema.safeParse({ ...base, inicio: "2026-10-01" }).success).toBe(false);
    expect(assistantRequestSchema.safeParse({ ...base, inicio: "2025-09-01" }).success).toBe(false);
    expect(assistantRequestSchema.safeParse({ ...base, fim: "2026-09-31" }).success).toBe(false);
  });
});
