import type { Request, Response } from "express";
import {
  forgotPasswordSchema,
  invitationLookupSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
} from "@ecommerce/contracts/auth";
import { principalOf } from "@/shared/http/authOf";
import type { Mailer } from "@/shared/mail/mailer.types";
import { parseOrThrow } from "@/shared/http/validate";
import {
  currentUser,
  invitationFor,
  login,
  logout,
  refresh,
  register,
  requestPasswordReset,
  resetPassword,
} from "./authService";

export type AuthDependencies = {
  secret: string;
  now: () => Date;
  rateLimited: boolean;
  mailer: Mailer;
  appUrl: string;
};

export function authController(deps: AuthDependencies) {
  const { secret, now } = deps;
  return {
    async forgotPassword(req: Request, res: Response) {
      const { email } = parseOrThrow(forgotPasswordSchema, req.body);
      await requestPasswordReset(email, deps);
      res.status(202).end();
    },
    async resetPassword(req: Request, res: Response) {
      await resetPassword(parseOrThrow(resetPasswordSchema, req.body), now());
      res.status(204).end();
    },
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
      const { token } = parseOrThrow(invitationLookupSchema, req.query);
      res.json(await invitationFor(token, now()));
    },
    async me(req: Request, res: Response) {
      res.json({ user: await currentUser(principalOf(req).userId) });
    },
  };
}
