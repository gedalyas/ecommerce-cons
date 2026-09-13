import type { Request, Response } from "express";
import {
  invitationLookupSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
} from "@ecommerce/contracts/auth";
import { principalOf } from "@/shared/http/authOf";
import { parseOrThrow } from "@/shared/http/validate";
import { currentUser, invitationFor, login, logout, refresh, register } from "./authService";

export type AuthDependencies = { secret: string; now: () => Date };

export function authController({ secret, now }: AuthDependencies) {
  return {
    async login(req: Request, res: Response) {
      const input = parseOrThrow(loginSchema, req.body);
      res.json(await login(input, secret, now()));
    },
    async refresh(req: Request, res: Response) {
      const input = parseOrThrow(refreshSchema, req.body);
      res.json(await refresh(input.refreshToken, secret, now()));
    },
    async logout(req: Request, res: Response) {
      const input = parseOrThrow(refreshSchema, req.body);
      await logout(input.refreshToken, now());
      res.status(204).end();
    },
    async register(req: Request, res: Response) {
      const input = parseOrThrow(registerSchema, req.body);
      res.status(201).json(await register(input, secret, now()));
    },
    async invitation(req: Request, res: Response) {
      const { email } = parseOrThrow(invitationLookupSchema, req.query);
      res.json(await invitationFor(email));
    },
    async me(req: Request, res: Response) {
      res.json({ user: await currentUser(principalOf(req).userId) });
    },
  };
}
