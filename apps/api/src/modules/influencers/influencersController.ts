import type { Request, Response } from "express";
import { influencerInputSchema, influencersSearchSchema } from "@ecommerce/contracts/influencers";
import { z } from "zod";
import { authOf } from "@/shared/http/authOf";
import { screenQuery } from "@/shared/http/parseQuery";
import { parseOrThrow } from "@/shared/http/validate";
import {
  createInfluencer,
  deleteInfluencer,
  influencersScreen,
  updateInfluencer,
} from "./influencersService";

const idSchema = z.string().min(1);

export function influencersController() {
  return {
    async screen(req: Request, res: Response) {
      res.json(
        await influencersScreen(authOf(req).clientId, screenQuery(req, influencersSearchSchema)),
      );
    },
    async create(req: Request, res: Response) {
      const input = parseOrThrow(influencerInputSchema, req.body);
      res.status(201).json(await createInfluencer(authOf(req).clientId, input));
    },
    async update(req: Request, res: Response) {
      const id = parseOrThrow(idSchema, req.params["id"]);
      const input = parseOrThrow(influencerInputSchema, req.body);
      res.json(await updateInfluencer(authOf(req).clientId, id, input));
    },
    async remove(req: Request, res: Response) {
      const id = parseOrThrow(idSchema, req.params["id"]);
      await deleteInfluencer(authOf(req).clientId, id);
      res.status(204).end();
    },
  };
}
