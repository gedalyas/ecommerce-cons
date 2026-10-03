import { describe, expect, it } from "vitest";
import {
  assistantContextLabel,
  assistantStorageKey,
  assistantSuggestions,
  questionScreenOf,
  requestProblemOf,
  requestMessagesOf,
  turnsOfStorage,
  type AssistantTurn,
} from "./assistantConversation";

const reply = (text: string): AssistantTurn => ({
  role: "assistant",
  text,
  origin: "Visão geral",
  caveats: [],
});

describe("requestMessagesOf", () => {
  it("sends the conversation without the notices and ends with the question", () => {
    const turns: AssistantTurn[] = [
      { role: "user", text: "Oi" },
      { role: "notice", text: "O assistente não respondeu." },
      { role: "user", text: "Quanto vendi?" },
      reply("R$ 10"),
    ];
    expect(requestMessagesOf(turns, "E o lucro?")).toEqual([
      { role: "user", text: "Oi" },
      { role: "user", text: "Quanto vendi?" },
      { role: "assistant", text: "R$ 10" },
      { role: "user", text: "E o lucro?" },
    ]);
  });

  it("keeps the last twelve messages and starts on a question", () => {
    const turns = Array.from({ length: 20 }, (_, i): AssistantTurn =>
      i % 2 === 0 ? { role: "user", text: `q${i}` } : reply(`r${i}`),
    );
    const messages = requestMessagesOf(turns, "última");
    expect(messages.length).toBeLessThanOrEqual(12);
    expect(messages[0]?.role).toBe("user");
    expect(messages.at(-1)).toEqual({ role: "user", text: "última" });
  });

  it("clips a long answer so the request stays valid", () => {
    const messages = requestMessagesOf([reply("a".repeat(5000))], "ok");
    expect(messages).toEqual([{ role: "user", text: "ok" }]);
    const long = requestMessagesOf([{ role: "user", text: "b".repeat(3000) }, reply("c")], "ok");
    expect(long[0]?.text).toHaveLength(2000);
  });
});

describe("turnsOfStorage", () => {
  it("reads back what was stored", () => {
    const turns: AssistantTurn[] = [{ role: "user", text: "Oi" }, reply("Olá")];
    expect(turnsOfStorage(JSON.stringify(turns))).toEqual(turns);
  });

  it("starts empty on nothing, broken JSON or another shape", () => {
    expect(turnsOfStorage(null)).toEqual([]);
    expect(turnsOfStorage("{")).toEqual([]);
    expect(turnsOfStorage(JSON.stringify([{ role: "ai", parts: [] }]))).toEqual([]);
  });
});

describe("assistantStorageKey", () => {
  it("keeps one conversation per person and store", () => {
    expect(assistantStorageKey("u1", "a")).not.toBe(assistantStorageKey("u1", "b"));
    expect(assistantStorageKey("u1", "a")).not.toBe(assistantStorageKey("u2", "a"));
  });
});

describe("requestProblemOf", () => {
  const request = {
    messages: [{ role: "user", text: "Quanto vendi?" }],
    inicio: "2026-09-01",
    fim: "2026-09-30",
    canal: "todos",
    screen: null,
  };

  it("lets a valid question through", () => {
    expect(requestProblemOf(request)).toBeNull();
  });

  it("says in Portuguese why the question cannot go", () => {
    expect(requestProblemOf({ ...request, inicio: "2025-01-01" })).toBe(
      "O período cobre no máximo um ano.",
    );
  });
});

describe("questionScreenOf", () => {
  it("asks about the store as a whole from the assistant's own page", () => {
    expect(questionScreenOf("ASSISTANT")).toBeNull();
    expect(questionScreenOf("MONEY")).toBe("MONEY");
    expect(questionScreenOf(null)).toBeNull();
  });
});

describe("assistantContextLabel", () => {
  it("names the screen the user is on", () => {
    expect(assistantContextLabel("MONEY")).toBe("Dinheiro");
    expect(assistantContextLabel(null)).toBe("Dashboard");
  });
});

describe("assistantSuggestions", () => {
  it("suggests questions about the screen, or about the store as a whole", () => {
    expect(assistantSuggestions("PRODUCTS")[0]).toBe("Quais produtos mais venderam?");
    expect(assistantSuggestions("LOGISTICS")).toEqual(assistantSuggestions(null));
    expect(assistantSuggestions(null)).toHaveLength(3);
  });
});
