import type { Request } from "express";
import type { AuthContext, Principal } from "./auth.types";
import { HttpError, unauthorized } from "./httpError";

export function principalOf(req: Request): Principal {
  if (!req.principal) throw unauthorized();
  return req.principal;
}

export function authOf(req: Request): AuthContext {
  if (!req.principal) throw unauthorized();
  if (!req.auth) throw new HttpError(400, "Informe a loja (cabeçalho x-client-id).");
  return req.auth;
}
