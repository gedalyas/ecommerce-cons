import type { Request, Response } from "express";
import { activityQuerySchema } from "@ecommerce/contracts/audit";
import type { Principal } from "@/shared/http/auth.types";
import { authOf, principalOf } from "@/shared/http/authOf";
import { forbidden } from "@/shared/http/httpError";
import { parseOrThrow } from "@/shared/http/validate";
import { staffActivity, storeActivity } from "./auditService";

export type AuditDependencies = {
  visibleStoresOf: (principal: Principal) => Promise<string[] | null>;
};

export function auditController({ visibleStoresOf }: AuditDependencies) {
  return {
    async store(req: Request, res: Response) {
      const { pagina } = parseOrThrow(activityQuerySchema, req.query);
      res.json(await storeActivity(authOf(req).clientId, pagina));
    },
    async staff(req: Request, res: Response) {
      const principal = principalOf(req);
      if (principal.role === "CLIENT") throw forbidden();
      const { pagina, storeId } = parseOrThrow(activityQuerySchema, req.query);
      res.json(await staffActivity(principal, await visibleStoresOf(principal), storeId, pagina));
    },
  };
}
