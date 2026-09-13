import type { Request, Response } from "express";
import {
  connectorCallbackSchema,
  connectorCredentialsSchema,
  connectorKeySchema,
  connectorStartSchema,
} from "@ecommerce/contracts/connectors";
import { authOf } from "@/shared/http/authOf";
import { parseOrThrow } from "@/shared/http/validate";
import {
  completeCallback,
  connectWithCredentials,
  dataReadiness,
  disconnect,
  startAuthorization,
  triggerSync,
  type ConnectorsDependencies,
} from "./connectorsService";

export function connectorsController(deps: ConnectorsDependencies) {
  return {
    async authorize(req: Request, res: Response) {
      const { key } = parseOrThrow(connectorKeySchema, req.params);
      const input = parseOrThrow(connectorStartSchema, req.body ?? {});
      res.json(startAuthorization(authOf(req), key, input, deps));
    },
    async callback(req: Request, res: Response) {
      const { key } = parseOrThrow(connectorKeySchema, req.params);
      const { code, state } = parseOrThrow(connectorCallbackSchema, req.query);
      const { redirectTo } = await completeCallback(key, code, state, deps);
      res.redirect(302, redirectTo);
    },
    async credentials(req: Request, res: Response) {
      const { key } = parseOrThrow(connectorKeySchema, req.params);
      const input = parseOrThrow(connectorCredentialsSchema, req.body);
      await connectWithCredentials(authOf(req), key, input, deps);
      res.status(201).json({ connected: true });
    },
    async remove(req: Request, res: Response) {
      const { key } = parseOrThrow(connectorKeySchema, req.params);
      await disconnect(authOf(req), key);
      res.status(204).end();
    },
    async sync(req: Request, res: Response) {
      const { key } = parseOrThrow(connectorKeySchema, req.params);
      await triggerSync(authOf(req), key, deps);
      res.status(202).json({ queued: true });
    },
    async readiness(req: Request, res: Response) {
      res.json(await dataReadiness(authOf(req).clientId));
    },
  };
}
