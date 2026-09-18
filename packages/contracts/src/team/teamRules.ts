import type { TeamSeats } from "./team.types";

export const DEFAULT_TEAM_SEAT_LIMIT = 5;

export function teamSeatsOf(input: {
  members: number;
  pendingInvitations: number;
  limit: number;
}): TeamSeats {
  const used = input.members + input.pendingInvitations;
  return { used, limit: input.limit, hasFree: used < input.limit };
}

export function seatLimitMessage(limit: number): string {
  return `Sua loja pode ter até ${limit} ${limit === 1 ? "pessoa" : "pessoas"} na equipe, contando convites pendentes. Remova alguém ou fale com sua consultoria para ampliar.`;
}
