import type { Request } from "express";
import type { AuthContext } from "./auth.types";
import { unauthorized } from "./httpError";

export function authOf(req: Request): AuthContext {
  if (!req.auth) throw unauthorized();
  return req.auth;
}
