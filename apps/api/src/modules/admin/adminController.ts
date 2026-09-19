import type { Request, Response } from "express";
import {
  assignConsultantsSchema,
  invitationInputSchema,
  releaseScreensSchema,
} from "@ecommerce/contracts/admin";
import { connectionRequestResolveSchema } from "@ecommerce/contracts/connectors";
import { z } from "zod";
import { principalOf } from "@/shared/http/authOf";
import type { Mailer } from "@/shared/mail/mailer.types";
import { parseOrThrow } from "@/shared/http/validate";
import { impersonate } from "@/modules/auth/contract";
import {
  adminScreen,
  adminUsersScreen,
  assignConsultants,
  createInvitation,
  resendInvitation,
  resolveRequest,
  revokeInvitation,
  setReleasedScreens,
  setStoreArchived,
} from "./adminService";

const idSchema = z.string().min(1);

export type AdminDependencies = {
  now: () => Date;
  mailer: Mailer;
  appUrl: string;
  secret: string;
};

export function adminController(deps: AdminDependencies) {
  const { now } = deps;
  return {
    async screen(req: Request, res: Response) {
      res.json(await adminScreen(principalOf(req), now()));
    },
    async users(req: Request, res: Response) {
      res.json(await adminUsersScreen(principalOf(req)));
    },
    async impersonate(req: Request, res: Response) {
      const id = parseOrThrow(idSchema, req.params["id"]);
      res.status(201).json(await impersonate(principalOf(req), id, deps.secret, now()));
    },
    async invite(req: Request, res: Response) {
      const input = parseOrThrow(invitationInputSchema, req.body);
      res.status(201).json(await createInvitation(principalOf(req), input, deps));
    },
    async archive(req: Request, res: Response) {
      const id = parseOrThrow(idSchema, req.params["id"]);
      res.json(await setStoreArchived(principalOf(req), id, true, now()));
    },
    async restore(req: Request, res: Response) {
      const id = parseOrThrow(idSchema, req.params["id"]);
      res.json(await setStoreArchived(principalOf(req), id, false, now()));
    },
    async resend(req: Request, res: Response) {
      const id = parseOrThrow(idSchema, req.params["id"]);
      res.json(await resendInvitation(principalOf(req), id, deps));
    },
    async revoke(req: Request, res: Response) {
      await revokeInvitation(principalOf(req), parseOrThrow(idSchema, req.params["id"]));
      res.status(204).end();
    },
    async assign(req: Request, res: Response) {
      const clientId = parseOrThrow(idSchema, req.params["id"]);
      const { consultantIds } = parseOrThrow(assignConsultantsSchema, req.body);
      res.json(await assignConsultants(principalOf(req), clientId, consultantIds));
    },
    async releaseScreens(req: Request, res: Response) {
      const clientId = parseOrThrow(idSchema, req.params["id"]);
      const { screens } = parseOrThrow(releaseScreensSchema, req.body);
      res.json(await setReleasedScreens(principalOf(req), clientId, screens));
    },
    async resolve(req: Request, res: Response) {
      const id = parseOrThrow(idSchema, req.params["id"]);
      const input = parseOrThrow(connectionRequestResolveSchema, req.body);
      res.json(await resolveRequest(principalOf(req), id, input, now()));
    },
  };
}
