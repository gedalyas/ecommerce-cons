import type { Request, Response } from "express";
import { costInputSchema, moneySearchSchema } from "@ecommerce/contracts/money";
import { z } from "zod";
import { authOf } from "@/shared/http/authOf";
import { periodOf, screenQuery } from "@/shared/http/parseQuery";
import { parseOrThrow } from "@/shared/http/validate";
import {
  createCost,
  deleteCost,
  marketingCostLines,
  moneyScreen,
  updateCost,
} from "./moneyService";

const idSchema = z.string().min(1);

export function moneyController() {
  return {
    async screen(req: Request, res: Response) {
      res.json(await moneyScreen(authOf(req).clientId, screenQuery(req, moneySearchSchema)));
    },
    async marketingCostLines(req: Request, res: Response) {
      res.json(await marketingCostLines(authOf(req).clientId, periodOf(req)));
    },
    async createCost(req: Request, res: Response) {
      const input = parseOrThrow(costInputSchema, req.body);
      res.status(201).json(await createCost(authOf(req).clientId, input));
    },
    async updateCost(req: Request, res: Response) {
      const id = parseOrThrow(idSchema, req.params["id"]);
      const input = parseOrThrow(costInputSchema, req.body);
      res.json(await updateCost(authOf(req).clientId, id, input));
    },
    async deleteCost(req: Request, res: Response) {
      const id = parseOrThrow(idSchema, req.params["id"]);
      await deleteCost(authOf(req).clientId, id);
      res.status(204).end();
    },
  };
}
