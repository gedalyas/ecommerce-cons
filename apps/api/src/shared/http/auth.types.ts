import type { UserRole } from "@ecommerce/contracts/auth";

export type AuthContext = { userId: string; clientId: string; role: UserRole };

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthContext;
  }
}
