import { describe, expect, it } from "vitest";
import { signOAuthState, verifyOAuthState } from "./oauthState";

const secret = "a-secret-with-at-least-thirty-two-characters";

describe("oauth state", () => {
  it("round-trips the identity of the store and the user", () => {
    const token = signOAuthState(
      { clientId: "c1", userId: "u1", key: "nuvemshop", domain: "loja" },
      secret,
    );
    expect(verifyOAuthState(token, secret)).toEqual({
      clientId: "c1",
      userId: "u1",
      key: "nuvemshop",
      domain: "loja",
    });
  });
  it("rejects a foreign secret, garbage and an access token", () => {
    const token = signOAuthState(
      { clientId: "c1", userId: "u1", key: "bling", domain: "" },
      secret,
    );
    expect(verifyOAuthState(token, "another-secret-with-thirty-two-chars!")).toBeNull();
    expect(verifyOAuthState("nope", secret)).toBeNull();
  });
});
