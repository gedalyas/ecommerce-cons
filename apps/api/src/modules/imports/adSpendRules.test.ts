import { describe, expect, it } from "vitest";
import { safeImageUrl } from "./adSpendRules";

describe("safeImageUrl", () => {
  it("keeps an https image address", () => {
    expect(safeImageUrl("https://scontent.fbcdn.net/v/t45/abc.jpg?oe=1")).toBe(
      "https://scontent.fbcdn.net/v/t45/abc.jpg?oe=1",
    );
  });

  it("drops anything that is not a plain https address", () => {
    expect(safeImageUrl("http://cdn.example/a.jpg")).toBeNull();
    expect(safeImageUrl("javascript:alert(1)")).toBeNull();
    expect(safeImageUrl("data:image/png;base64,AAAA")).toBeNull();
    expect(safeImageUrl("not a url")).toBeNull();
    expect(safeImageUrl(`https://cdn.example/${"a".repeat(2100)}`)).toBeNull();
    expect(safeImageUrl(null)).toBeNull();
  });
});
