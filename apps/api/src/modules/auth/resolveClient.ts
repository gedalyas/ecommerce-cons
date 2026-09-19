import type { RequestHandler } from "express";
import { forbidden, HttpError, unauthorized } from "@/shared/http/httpError";
import { storeAccessOf } from "./authService";
import {
  ARCHIVED_STORE_MESSAGE,
  canAccessStore,
  defaultStoreOf,
  isBlockedByArchive,
} from "./storeAccess";

export const CLIENT_HEADER = "x-client-id";

export const resolveClient: RequestHandler = (req, _res, next) => {
  const principal = req.principal;
  if (!principal) {
    next(unauthorized());
    return;
  }
  storeAccessOf(principal)
    .then((access) => {
      const requested = req.header(CLIENT_HEADER)?.trim() || defaultStoreOf(access);
      if (!requested) throw new HttpError(400, "Informe a loja (cabeçalho x-client-id).");
      if (!canAccessStore(access, requested)) throw forbidden("Você não tem acesso a esta loja.");
      if (isBlockedByArchive(access, requested)) throw forbidden(ARCHIVED_STORE_MESSAGE);
      req.auth = {
        ...principal,
        clientId: requested,
        access: access.areaAccess,
        release: access.release,
      };
      next();
    })
    .catch(next);
};
