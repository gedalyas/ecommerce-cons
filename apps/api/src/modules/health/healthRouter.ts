import { Router } from "express";
import { asyncHandler } from "@/shared/http/asyncHandler";
import { pingDatabase } from "./healthService";

export function createHealthRouter(): Router {
  const router = Router();
  router.get(
    "/health",
    asyncHandler(async (_req, res) => {
      await pingDatabase();
      res.json({ status: "ok" });
    }),
  );
  return router;
}
