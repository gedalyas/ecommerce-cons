import { describe, expect, it } from "vitest";
import { escapeHtml } from "./escapeHtml";

describe("escapeHtml", () => {
  it("escapes the characters that open markup or attributes", () => {
    expect(escapeHtml(`<b>"Loja" & 'Cia'</b>`)).toBe(
      "&#60;b&#62;&#34;Loja&#34; &#38; &#39;Cia&#39;&#60;/b&#62;",
    );
  });
});
