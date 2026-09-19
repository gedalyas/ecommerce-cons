import type { AreaAccess, ScreenRelease, UserRole } from "@ecommerce/contracts/auth";

export type Principal = { userId: string; role: UserRole; impersonatorId?: string };

export type AuthContext = Principal & {
  clientId: string;
  access: AreaAccess;
  release: ScreenRelease;
};

declare module "express-serve-static-core" {
  interface Request {
    principal?: Principal;
    auth?: AuthContext;
  }
}
