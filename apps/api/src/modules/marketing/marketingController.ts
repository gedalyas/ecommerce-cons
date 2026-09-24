import type { Request, Response } from "express";
import {
  campaignTagSchema,
  marketingSearchSchema,
  type MarketingCostLine,
  type MarketingRetention,
  type MarketingScreen,
} from "@ecommerce/contracts/marketing";
import type { PeriodSearch } from "@ecommerce/contracts/shared/period";
import { currentDay } from "@/shared/config/clock";
import { authOf } from "@/shared/http/authOf";
import { forbidden } from "@/shared/http/httpError";
import { parseOrThrow } from "@/shared/http/validate";
import { screenQuery } from "@/shared/http/parseQuery";
import { tagCampaign } from "./campaignTagsService";
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
      const input = {
        ...search,
        custos: await costLinesFor(clientId, search),
        canEdit: role !== "CLIENT",
      };
      const screen: MarketingScreen =
        search.aba === "visao"
          ? {
              aba: "visao",
              ...(await marketingVisao(
                clientId,
                input,
                await retentionFor(clientId),
                input.canEdit,
              )),
            }
          : await marketingScreen(clientId, input);
      res.json(screen);
    },
    async tagCampaign(req: Request, res: Response) {
      const auth = authOf(req);
      if (auth.role === "CLIENT") throw forbidden("Só a consultoria marca as campanhas.");
      const input = parseOrThrow(campaignTagSchema, req.body ?? {});
      await tagCampaign(auth, input, currentDay());
      res.status(204).end();
    },
  };
}
