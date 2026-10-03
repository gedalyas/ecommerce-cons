import { describe, expect, it } from "vitest";
import { replyOfAnswer } from "./assistantAnswer";

const answer = (fields: Record<string, unknown>) =>
  JSON.stringify({
    area: "marketing",
    pillar: "acquisition",
    text: "ROAS de 3,2.",
    caveats: [],
    ...fields,
  });

describe("the answer's origin", () => {
  const originOf = (fields: Record<string, unknown>) => replyOfAnswer(answer(fields))?.origin;

  it("names the area and the pillar of a consulting area", () => {
    expect(originOf({})).toBe("Marketing · Aquisição");
    expect(originOf({ area: "money", pillar: "organization" })).toBe("Dinheiro · Organização");
  });

  it("drops a pillar that belongs to another area", () => {
    expect(originOf({ area: "money", pillar: "acquisition" })).toBe("Dinheiro");
  });

  it("names the data screens and the overview", () => {
    expect(originOf({ area: "products", pillar: null })).toBe("Produtos");
    expect(originOf({ area: "overview", pillar: "acquisition" })).toBe("Visão geral");
  });
});

describe("replyOfAnswer", () => {
  it("turns the structured answer into the reply with its origin", () => {
    expect(
      replyOfAnswer(answer({ caveats: [" Meta Ads sem sincronizar há 6 dias. ", ""] })),
    ).toEqual({
      text: "ROAS de 3,2.",
      origin: "Marketing · Aquisição",
      caveats: ["Meta Ads sem sincronizar há 6 dias."],
    });
  });

  it("keeps at most three caveats", () => {
    const reply = replyOfAnswer(answer({ caveats: ["a", "b", "c", "d"] }));
    expect(reply?.caveats).toEqual(["a", "b", "c"]);
  });

  it("refuses text that is not the expected JSON", () => {
    expect(replyOfAnswer("Olá!")).toBeNull();
    expect(replyOfAnswer(answer({ area: "weather" }))).toBeNull();
    expect(replyOfAnswer(answer({ text: "  " }))).toBeNull();
  });
});
