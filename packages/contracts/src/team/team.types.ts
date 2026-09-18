import type { InvitationStatus } from "../admin/admin.types";
import type { AreaGrant } from "../auth/accessAreas";

export type TeamMember = {
  id: string;
  name: string;
  email: string;
  grants: AreaGrant[];
  createdAt: string;
};

export type TeamInvitation = {
  id: string;
  email: string;
  grants: AreaGrant[];
  createdAt: string;
  expiresAt: string | null;
  status: InvitationStatus;
};

export type TeamSeats = { used: number; limit: number; hasFree: boolean };

export type TeamScreen = {
  seats: TeamSeats;
  members: TeamMember[];
  invitations: TeamInvitation[];
};
