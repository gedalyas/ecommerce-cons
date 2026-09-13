export const userRoles = ["CONSULTANT", "CLIENT"] as const;
export type UserRole = (typeof userRoles)[number];

export const userRoleLabel: Record<UserRole, string> = {
  CONSULTANT: "Consultor",
  CLIENT: "Cliente",
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  client: { id: string; slug: string; name: string };
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
