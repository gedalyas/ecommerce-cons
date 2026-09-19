import type { AreaGrant, ClientMembership } from "./accessAreas";
import type { StoreScreen } from "./storeScreens";

export const userRoles = ["ADMIN", "CONSULTANT", "CLIENT"] as const;
export type UserRole = (typeof userRoles)[number];

export const userRoleLabel: Record<UserRole, string> = {
  ADMIN: "Administrador",
  CONSULTANT: "Consultor",
  CLIENT: "Cliente",
};

export type StoreSummary = {
  id: string;
  slug: string;
  name: string;
  onboardedAt: string | null;
  archivedAt: string | null;
  releasedScreens: StoreScreen[];
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  membership: ClientMembership | null;
  grants: AreaGrant[];
  stores: StoreSummary[];
};

export type AuthTokens = {
  accessToken: string;
  accessExpiresIn: number;
  refreshToken: string;
  refreshExpiresIn: number;
};

export type LoginResponse = { user: AuthUser; tokens: AuthTokens };
export type RefreshResponse = { tokens: AuthTokens };
export type MeResponse = { user: AuthUser };
export type InvitationCheck = {
  email: string;
  role: UserRole;
  membership: ClientMembership;
  storeName: string | null;
};
