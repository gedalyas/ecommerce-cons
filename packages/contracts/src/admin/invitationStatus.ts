import type { InvitationStatus } from "./admin.types";

export function invitationStatusOf(
  invitation: { acceptedAt: Date | null; expiresAt: Date | null },
  now: Date,
): InvitationStatus {
  if (invitation.acceptedAt) return "ACCEPTED";
  if (!invitation.expiresAt || invitation.expiresAt <= now) return "EXPIRED";
  return "PENDING";
}
