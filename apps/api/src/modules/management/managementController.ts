import type { Request, Response } from "express";
import { authOf } from "@/shared/http/authOf";
import { managementScreen } from "./managementService";

export function managementController() {
  return {
    async screen(req: Request, res: Response) {
      res.json(await managementScreen(authOf(req).clientId));
    },
  };
}
