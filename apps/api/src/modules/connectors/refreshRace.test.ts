import { describe, expect, it } from "vitest";
import { credentialsAfterRefresh } from "./refreshRace";

describe("credentialsAfterRefresh", () => {
  it("keeps its own renewal when it was the one saved", () => {
    expect(credentialsAfterRefresh({ outcome: "saved", read: "a", latest: "b" })).toBe("own");
  });

  it("uses the token another integration of the account saved first", () => {
    expect(credentialsAfterRefresh({ outcome: "conflict", read: "a", latest: "b" })).toBe("latest");
  });

  it("keeps its own renewal when the account is gone", () => {
    expect(credentialsAfterRefresh({ outcome: "conflict", read: "a", latest: null })).toBe("own");
  });

  it("recovers a failed renewal with the newer token a sibling saved", () => {
    expect(credentialsAfterRefresh({ outcome: "failed", read: "a", latest: "b" })).toBe("latest");
  });

  it("fails when nobody renewed the token", () => {
    expect(credentialsAfterRefresh({ outcome: "failed", read: "a", latest: "a" })).toBe("rethrow");
    expect(credentialsAfterRefresh({ outcome: "failed", read: "a", latest: null })).toBe("rethrow");
  });
});
