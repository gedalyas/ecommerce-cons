import type { Request, Response } from "express";
import { ordersSearchSchema } from "@ecommerce/contracts/orders";
import { authOf } from "@/shared/http/authOf";
import { screenQuery } from "@/shared/http/parseQuery";
import { ordersExport, ordersScreen } from "./ordersScreenService";

export function ordersController() {
  return {
    async screen(req: Request, res: Response) {
      res.json(await ordersScreen(authOf(req).clientId, screenQuery(req, ordersSearchSchema)));
    },
    async exportRows(req: Request, res: Response) {
      res.json(await ordersExport(authOf(req).clientId, screenQuery(req, ordersSearchSchema)));
    },
  };
}
