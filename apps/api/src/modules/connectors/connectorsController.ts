import type { Request, Response } from "express";
import {
  connectionCreateSchema,
  connectionParamsSchema,
  connectorCallbackSchema,
  connectorCredentialsSchema,
  connectorKeySchema,
  connectorSettingsSchema,
  connectorStartSchema,
  areaOfDataKind,
  dataSourceChoiceSchema,
} from "@ecommerce/contracts/connectors";
import { assertAreaEdit, assertConnectorEdit } from "@/modules/auth/contract";
import { currentDay } from "@/shared/config/clock";
import { authOf } from "@/shared/http/authOf";
import { parseOrThrow } from "@/shared/http/validate";
import {
  completeCallback,
  connectWithCredentials,
  dataReadiness,
  startAuthorization,
  type ConnectorsDependencies,
} from "./connectorsService";
import {
  connectorSettings,
  createOnAccount,
  disconnect,
  saveConnectorSettings,
  triggerSync,
} from "./integrationsService";
import { checkConnection } from "./connectionCheckService";
import { chooseDataSource } from "./dataSourceChoiceService";

function managing(req: Request) {
  const { key } = parseOrThrow(connectorKeySchema, req.params);
  const auth = authOf(req);
  assertConnectorEdit(auth, key);
  return { auth, key };
}

function managingIntegration(req: Request) {
  const { key, id } = parseOrThrow(connectionParamsSchema, req.params);
  const auth = authOf(req);
  assertConnectorEdit(auth, key);
  return { auth, key, id };
}

async function chooseSource(req: Request, res: Response) {
  const auth = authOf(req);
  const choice = parseOrThrow(dataSourceChoiceSchema, req.body ?? {});
  assertAreaEdit(auth, areaOfDataKind[choice.kind]);
  await chooseDataSource(auth, choice, currentDay());
  res.status(204).end();
}

function integrationsController(deps: ConnectorsDependencies) {
  return {
    async create(req: Request, res: Response) {
      const { auth, key } = managing(req);
      const input = parseOrThrow(connectionCreateSchema, req.body);
      res.status(201).json(await createOnAccount(auth, key, input, deps));
    },
    async remove(req: Request, res: Response) {
      const { auth, key, id } = managingIntegration(req);
      await disconnect(auth, key, id);
      res.status(204).end();
    },
    async sync(req: Request, res: Response) {
      const { auth, key, id } = managingIntegration(req);
      await triggerSync(auth, key, id, deps);
      res.status(202).json({ queued: true });
    },
    async test(req: Request, res: Response) {
      const { auth, key, id } = managingIntegration(req);
      res.json(await checkConnection(auth, key, id, deps));
    },
    async settings(req: Request, res: Response) {
      const { auth, key, id } = managingIntegration(req);
      res.json(await connectorSettings(auth, key, id, deps));
    },
    async saveSettings(req: Request, res: Response) {
      const { auth, key, id } = managingIntegration(req);
      const input = parseOrThrow(connectorSettingsSchema, req.body);
      await saveConnectorSettings(auth, key, id, input, deps);
      res.status(204).end();
    },
  };
}

export function connectorsController(deps: ConnectorsDependencies) {
  return {
    chooseSource,
    async authorize(req: Request, res: Response) {
      const { auth, key } = managing(req);
      const input = parseOrThrow(connectorStartSchema, req.body ?? {});
      res.json(await startAuthorization(auth, key, input, deps));
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
    ...integrationsController(deps),
    async readiness(req: Request, res: Response) {
      res.json(await dataReadiness(authOf(req).clientId));
    },
  };
}
