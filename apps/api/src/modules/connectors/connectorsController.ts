import type { Request, Response } from "express";
import {
  connectorCallbackSchema,
  connectorCredentialsSchema,
  connectorKeySchema,
  connectorSettingsSchema,
  connectorStartSchema,
} from "@ecommerce/contracts/connectors";
import { assertConnectorEdit } from "@/modules/auth/contract";
import { authOf } from "@/shared/http/authOf";
import { parseOrThrow } from "@/shared/http/validate";
import {
  completeCallback,
  connectWithCredentials,
  connectorSettings,
  dataReadiness,
  saveConnectorSettings,
  disconnect,
  startAuthorization,
  triggerSync,
  type ConnectorsDependencies,
} from "./connectorsService";

function managing(req: Request) {
  const { key } = parseOrThrow(connectorKeySchema, req.params);
  const auth = authOf(req);
  assertConnectorEdit(auth, key);
  return { auth, key };
}

export function connectorsController(deps: ConnectorsDependencies) {
  return {
    async authorize(req: Request, res: Response) {
      const { auth, key } = managing(req);
      const input = parseOrThrow(connectorStartSchema, req.body ?? {});
      res.json(startAuthorization(auth, key, input, deps));
    },
    async callback(req: Request, res: Response) {
      const { key } = parseOrThrow(connectorKeySchema, req.params);
      const { code, state, query } = parseOrThrow(connectorCallbackSchema, req.query);
      const { redirectTo } = await completeCallback(key, { code, state, query }, deps);
      res.redirect(302, redirectTo);
    },
    async credentials(req: Request, res: Response) {
      const { auth, key } = managing(req);
      const input = parseOrThrow(connectorCredentialsSchema, req.body);
      await connectWithCredentials(auth, key, input, deps);
      res.status(201).json({ connected: true });
    },
    async remove(req: Request, res: Response) {
      const { auth, key } = managing(req);
      await disconnect(auth, key);
      res.status(204).end();
    },
    async sync(req: Request, res: Response) {
      const { auth, key } = managing(req);
      await triggerSync(auth, key, deps);
      res.status(202).json({ queued: true });
    },
    async settings(req: Request, res: Response) {
      const { auth, key } = managing(req);
      res.json(await connectorSettings(auth, key, deps));
    },
    async saveSettings(req: Request, res: Response) {
      const { auth, key } = managing(req);
      const input = parseOrThrow(connectorSettingsSchema, req.body);
      await saveConnectorSettings(auth, key, input, deps);
      res.status(204).end();
    },
    async readiness(req: Request, res: Response) {
      res.json(await dataReadiness(authOf(req).clientId));
    },
  };
}
