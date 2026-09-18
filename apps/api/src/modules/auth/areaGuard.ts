import { Router, type RequestHandler } from "express";
import {
  accessAreaLabel,
  accessAreas,
  canEditArea,
  canViewArea,
  type AccessArea,
} from "@ecommerce/contracts/auth";
import {
  canManageConnector,
  connectorOf,
  type ConnectorKey,
} from "@ecommerce/contracts/connectors";
import type { AuthContext } from "@/shared/http/auth.types";
import { forbidden } from "@/shared/http/httpError";
import { areaRoutePrefixes, levelRequiredBy } from "./areaRoutes";

export const viewDeniedMessage = (area: AccessArea) =>
  `Você não tem acesso à área ${accessAreaLabel[area]}. Peça ao dono da loja para liberar.`;
export const editDeniedMessage = (area: AccessArea) =>
  `Você só pode ver a área ${accessAreaLabel[area]}. Peça ao dono da loja para liberar a edição.`;

export function assertAreaView(auth: AuthContext, area: AccessArea): void {
  if (!canViewArea(auth.access, area)) throw forbidden(viewDeniedMessage(area));
}

export function assertAreaEdit(auth: AuthContext, area: AccessArea): void {
  assertAreaView(auth, area);
  if (!canEditArea(auth.access, area)) throw forbidden(editDeniedMessage(area));
}

export function assertConnectorEdit(auth: AuthContext, key: ConnectorKey): void {
  if (!canManageConnector(auth.access, connectorOf(key))) {
    throw forbidden(
      "Você não tem permissão para mexer nesta conexão. Peça ao dono da loja para liberar a edição da área.",
    );
  }
}

export function assertOwner(auth: AuthContext): void {
  if (auth.access !== null) throw forbidden("Só o dono da loja pode fazer isso.");
}

export function requireArea(area: AccessArea): RequestHandler {
  return (req, _res, next) => {
    const auth = req.auth;
    if (!auth) {
      next();
      return;
    }
    try {
      if (levelRequiredBy(req.method) === "edit") assertAreaEdit(auth, area);
      else assertAreaView(auth, area);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function createAreaGuards(): Router {
  const router = Router();
  for (const area of accessAreas) router.use([...areaRoutePrefixes[area]], requireArea(area));
  return router;
}
