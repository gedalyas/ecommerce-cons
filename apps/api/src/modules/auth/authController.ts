import type { Request, Response } from "express";
import { loginSchema, refreshSchema } from "@ecommerce/contracts/auth";
import { authOf } from "@/shared/http/authOf";
import { parseOrThrow } from "@/shared/http/validate";
import { currentUser, login, logout, refresh } from "./authService";

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
    async me(req: Request, res: Response) {
      res.json({ user: await currentUser(authOf(req).userId) });
    },
  };
}
