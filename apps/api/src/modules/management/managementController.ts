import type { Request, Response } from "express";
import { authOf } from "@/shared/http/authOf";
import { periodOf } from "@/shared/http/parseQuery";
import { managementScreen } from "./managementService";

export function managementController() {
  return {
    async screen(req: Request, res: Response) {
      const auth = authOf(req);
      res.json(await managementScreen(auth.clientId, periodOf(req), auth.role !== "CLIENT"));
    },
  };
}
