import type { Request, Response } from "express";
import { authOf } from "@/shared/http/authOf";
import { connectionsHealth, connectionsScreen } from "./connectionsService";

export function connectionsController() {
  return {
    async screen(req: Request, res: Response) {
      res.json(await connectionsScreen(authOf(req).clientId));
    },
    async health(req: Request, res: Response) {
      res.json(await connectionsHealth(authOf(req).clientId));
    },
  };
}
