import type { UserRole } from "../auth/auth.types";
import type { ConnectionRequest } from "../connectors/connectors.types";

export type ConsultantSummary = { id: string; name: string; email: string };

export type AdminStore = {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
  onboardedAt: string | null;
  archivedAt: string | null;
  users: number;
  consultants: ConsultantSummary[];
  pendingRequests: number;
};

export const invitationStatuses = ["PENDING", "EXPIRED", "ACCEPTED"] as const;
export type InvitationStatus = (typeof invitationStatuses)[number];

export const invitationStatusLabel: Record<InvitationStatus, string> = {
  PENDING: "Pendente",
  EXPIRED: "Expirado",
  ACCEPTED: "Aceito",
};

export type Invitation = {
  id: string;
  email: string;
  role: UserRole;
  storeName: string | null;
  invitedBy: string;
  createdAt: string;
  expiresAt: string | null;
  acceptedAt: string | null;
  status: InvitationStatus;
};

export type AdminConnectionRequest = ConnectionRequest & { storeId: string; storeName: string };

export type AdminScreen = {
  role: UserRole;
  stores: AdminStore[];
  consultants: ConsultantSummary[];
  invitations: Invitation[];
  requests: AdminConnectionRequest[];
};
