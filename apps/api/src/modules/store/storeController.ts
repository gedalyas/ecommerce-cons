import type { Request, Response } from "express";
import { storeProfileSchema } from "@ecommerce/contracts/store";
import { authOf, principalOf } from "@/shared/http/authOf";
import { parseOrThrow } from "@/shared/http/validate";
import { createStore, storeOf, updateStore } from "./storeService";

export type StoreDependencies = { now: () => Date };

export function storeController({ now }: StoreDependencies) {
  return {
    async create(req: Request, res: Response) {
      const input = parseOrThrow(storeProfileSchema, req.body);
      res.status(201).json(await createStore(principalOf(req), input, now()));
    },
    async current(req: Request, res: Response) {
      res.json(await storeOf(authOf(req).clientId));
    },
    async update(req: Request, res: Response) {
      const input = parseOrThrow(storeProfileSchema, req.body);
      res.json(await updateStore(authOf(req), input));
    },
  };
}
