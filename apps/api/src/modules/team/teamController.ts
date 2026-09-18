import type { Request, Response } from "express";
import { teamIdSchema, teamInviteSchema, teamMemberUpdateSchema } from "@ecommerce/contracts/team";
import { authOf } from "@/shared/http/authOf";
import type { Mailer } from "@/shared/mail/mailer.types";
import { parseOrThrow } from "@/shared/http/validate";
import {
  inviteMember,
  removeMember,
  resendMemberInvitation,
  revokeMemberInvitation,
  teamScreen,
  updateMember,
} from "./teamService";

export type TeamDependencies = { now: () => Date; mailer: Mailer; appUrl: string };

export function teamController(deps: TeamDependencies) {
  const { now } = deps;
  return {
    async screen(req: Request, res: Response) {
      res.json(await teamScreen(authOf(req), now()));
    },
    async invite(req: Request, res: Response) {
      const input = parseOrThrow(teamInviteSchema, req.body);
      res.status(201).json(await inviteMember(authOf(req), input, deps));
    },
    async resend(req: Request, res: Response) {
      const { id } = parseOrThrow(teamIdSchema, req.params);
      res.json(await resendMemberInvitation(authOf(req), id, deps));
    },
    async revoke(req: Request, res: Response) {
      const { id } = parseOrThrow(teamIdSchema, req.params);
      await revokeMemberInvitation(authOf(req), id);
      res.status(204).end();
    },
    async update(req: Request, res: Response) {
      const { id } = parseOrThrow(teamIdSchema, req.params);
      const { grants } = parseOrThrow(teamMemberUpdateSchema, req.body);
      res.json(await updateMember(authOf(req), id, grants));
    },
    async remove(req: Request, res: Response) {
      const { id } = parseOrThrow(teamIdSchema, req.params);
      await removeMember(authOf(req), id);
      res.status(204).end();
    },
  };
}
