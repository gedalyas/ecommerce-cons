import type { Request, Response } from "express";
import { reportRequestSchema } from "@ecommerce/contracts/reports";
import { authOf } from "@/shared/http/authOf";
import { parseOrThrow } from "@/shared/http/validate";
import { reportPreview, type ReportDependencies } from "./reportsService";

export function reportsController(deps: ReportDependencies) {
  return {
    async preview(req: Request, res: Response) {
      const request = parseOrThrow(reportRequestSchema, req.body ?? {});
      res.json(await reportPreview(authOf(req), request, deps));
    },
  };
}
