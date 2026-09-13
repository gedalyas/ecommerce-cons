import type { UserRole } from "@ecommerce/contracts/auth";

export type Principal = { userId: string; role: UserRole };

export type AuthContext = Principal & { clientId: string };

declare module "express-serve-static-core" {
  interface Request {
    principal?: Principal;
    auth?: AuthContext;
  }
}
