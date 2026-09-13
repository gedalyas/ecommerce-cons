import type { Request, Response } from "express";
import type { MarketingCostLine, MarketingRetention } from "@ecommerce/contracts/marketing";
import { marketingSearchSchema } from "@ecommerce/contracts/marketing";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import { authOf } from "@/shared/http/authOf";
import { screenQuery } from "@/shared/http/parseQuery";
import { marketingScreen } from "./marketingScreenService";

export type MarketingDependencies = {
  costLinesFor: (clientId: string, search: PeriodSearch) => Promise<MarketingCostLine[]>;
  retentionFor: (clientId: string) => Promise<MarketingRetention>;
};

export function marketingController({ costLinesFor, retentionFor }: MarketingDependencies) {
  return {
    async screen(req: Request, res: Response) {
      const { clientId } = authOf(req);
      const search = screenQuery(req, marketingSearchSchema);
      const custos = await costLinesFor(clientId, search);
      const screen = await marketingScreen(clientId, { ...search, custos });
      res.json(
        screen.aba === "visao" ? { ...screen, retention: await retentionFor(clientId) } : screen,
      );
    },
  };
}
