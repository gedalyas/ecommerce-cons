import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { auditController, type AuditDependencies } from "./auditController";

export function createStoreActivityRouter(deps: AuditDependencies): Router {
  const router = Router();
  router.get("/activity", asyncHandler(auditController(deps).store));
  return router;
}

export function createStaffActivityRouter(deps: AuditDependencies): Router {
  const router = Router();
  router.get("/admin/activity", asyncHandler(auditController(deps).staff));
  return router;
}
