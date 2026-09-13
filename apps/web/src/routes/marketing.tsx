import { createFileRoute, stripSearchParams, useRouter } from "@tanstack/react-router";
import { getRetentionSummary } from "@/modules/customers/contract";
import {
  Marketing,
  defaultMarketingSearch,
  getMarketingScreen,
  marketingSearchSchema,
} from "@/modules/marketing/contract";
import { getMarketingCostLines } from "@/modules/money/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";

export const Route = createFileRoute("/marketing")({
  validateSearch: marketingSearchSchema,
  search: { middlewares: [stripSearchParams(defaultMarketingSearch)] },
  head: () => ({
    meta: [
      { title: "Marketing · Loja Aurora | CAC, conversão e retenção" },
      {
        name: "description",
        content:
          "Marketing da Loja Aurora: desempenho por canal, funil de conversão, campanhas por plataforma e cupons, com CAC, ROAS e recompra.",
      },
      { property: "og:title", content: "Marketing · Loja Aurora" },
      {
        property: "og:description",
        content:
          "CAC, ROAS, conversão e retenção da Loja Aurora com alertas de dados desatualizados.",
      },
    ],
  }),
  loaderDeps: ({ search }) => search,
  /**
   * The composition root: marketing cannot import money (money reads its ad
   * spend) nor customers (customers read it for CAC), so the route fetches
   * the marketing cost lines and the retention summary and hands them over.
   */
  loader: async ({ deps }) => {
    const [custos, retention] = await Promise.all([
      getMarketingCostLines({ data: deps }),
      deps.aba === "visao"
        ? getRetentionSummary()
        : Promise.resolve({ repurchaseRate90: null, ltv12Months: null }),
    ]);
    const data = await getMarketingScreen({ data: { ...deps, custos } });
    return { data, retention };
  },
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const { data, retention } = Route.useLoaderData();
  return <Marketing data={data} retention={retention} />;
}

function RouteError() {
  const router = useRouter();
  return (
    <div className={layout.page}>
      <RequestError className="mt-6" onRetry={() => void router.invalidate()} />
    </div>
  );
}
