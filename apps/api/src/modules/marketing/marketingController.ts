import type { Request, Response } from "express";
import {
  marketingSearchSchema,
  type MarketingCostLine,
  type MarketingRetention,
  type MarketingScreen,
} from "@ecommerce/contracts/marketing";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import { authOf } from "@/shared/http/authOf";
import { screenQuery } from "@/shared/http/parseQuery";
import { marketingScreen, marketingVisao } from "./marketingScreenService";

export type MarketingDependencies = {
  costLinesFor: (clientId: string, search: PeriodSearch) => Promise<MarketingCostLine[]>;
  retentionFor: (clientId: string) => Promise<MarketingRetention>;
};

export function marketingController({ costLinesFor, retentionFor }: MarketingDependencies) {
  return {
    async screen(req: Request, res: Response) {
      const { clientId, role } = authOf(req);
      const search = screenQuery(req, marketingSearchSchema);
      const custos = await costLinesFor(clientId, search);
      const screen: MarketingScreen =
        search.aba === "visao"
          ? {
              aba: "visao",
              ...(await marketingVisao(
                clientId,
                { ...search, custos },
                await retentionFor(clientId),
                role !== "CLIENT",
              )),
            }
          : await marketingScreen(clientId, { ...search, custos });
      res.json(screen);
    },
  };
}
