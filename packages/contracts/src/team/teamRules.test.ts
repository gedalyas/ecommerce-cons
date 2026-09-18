import { describe, expect, it } from "vitest";
import { seatLimitMessage, teamSeatsOf } from "./teamRules";

describe("teamSeatsOf", () => {
  it("counts members and pending invitations against the limit", () => {
    expect(teamSeatsOf({ members: 2, pendingInvitations: 1, limit: 5 })).toEqual({
      used: 3,
      limit: 5,
      hasFree: true,
    });
  });

  it("has no free seat once the limit is reached", () => {
    expect(teamSeatsOf({ members: 4, pendingInvitations: 1, limit: 5 }).hasFree).toBe(false);
    expect(teamSeatsOf({ members: 0, pendingInvitations: 0, limit: 0 }).hasFree).toBe(false);
  });
});

describe("seatLimitMessage", () => {
  it("names the limit in Portuguese", () => {
    expect(seatLimitMessage(5)).toContain("até 5 pessoas");
    expect(seatLimitMessage(1)).toContain("até 1 pessoa ");
  });
});
