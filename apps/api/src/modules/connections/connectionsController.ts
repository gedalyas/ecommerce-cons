import type { Request, Response } from "express";
import { connectionRequestInputSchema, connectorKeySchema } from "@ecommerce/contracts/connectors";
import { authOf } from "@/shared/http/authOf";
import { parseOrThrow } from "@/shared/http/validate";
import {
  connectionsHealth,
  connectionsScreen,
  requestConnection,
  type ConnectionsOf,
} from "./connectionsService";

export type ConnectionsDependencies = { connectionsOf: ConnectionsOf };

export function connectionsController({ connectionsOf }: ConnectionsDependencies) {
  return {
    async screen(req: Request, res: Response) {
      res.json(await connectionsScreen(authOf(req), connectionsOf));
    },
    async health(req: Request, res: Response) {
      res.json(await connectionsHealth(authOf(req).clientId));
    },
    async request(req: Request, res: Response) {
      const { key } = parseOrThrow(connectorKeySchema, req.params);
      const input = parseOrThrow(connectionRequestInputSchema, req.body ?? {});
      res.status(201).json(await requestConnection(authOf(req), key, input));
    },
  };
}
