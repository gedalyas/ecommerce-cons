import type { RequestHandler } from "express";
import { unauthorized } from "@/shared/http/httpError";
import { verifyAccessToken } from "./tokens";

export function createRequireAuth(secret: string): RequestHandler {
  return (req, _res, next) => {
    const header = req.header("authorization") ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    const auth = token ? verifyAccessToken(token, secret) : null;
    if (!auth) {
      next(unauthorized());
      return;
    }
    req.auth = auth;
    next();
  };
}
