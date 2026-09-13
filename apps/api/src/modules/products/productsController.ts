import type { Request, Response } from "express";
import { productsSearchSchema } from "@ecommerce/contracts/products";
import { authOf } from "@/shared/http/authOf";
import { screenQuery } from "@/shared/http/parseQuery";
import { productsScreen } from "./productsScreenService";

export function productsController() {
  return {
    async screen(req: Request, res: Response) {
      res.json(await productsScreen(authOf(req).clientId, screenQuery(req, productsSearchSchema)));
    },
  };
}
