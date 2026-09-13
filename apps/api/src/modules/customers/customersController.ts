import type { Request, Response } from "express";
import { customersSearchSchema } from "@ecommerce/contracts/customers";
import { authOf } from "@/shared/http/authOf";
import { screenQuery } from "@/shared/http/parseQuery";
import {
  customersExport,
  customersScreen,
  refreshCustomers,
  retentionSummary,
} from "./customersScreenService";

export function customersController() {
  return {
    async screen(req: Request, res: Response) {
      res.json(
        await customersScreen(authOf(req).clientId, screenQuery(req, customersSearchSchema)),
      );
    },
    async exportRows(req: Request, res: Response) {
      res.json(
        await customersExport(authOf(req).clientId, screenQuery(req, customersSearchSchema)),
      );
    },
    async refreshSegments(req: Request, res: Response) {
      res.json({ updated: await refreshCustomers(authOf(req).clientId) });
    },
    async retention(req: Request, res: Response) {
      res.json(await retentionSummary(authOf(req).clientId));
    },
  };
}
