import { createFileRoute, stripSearchParams, useRouter } from "@tanstack/react-router";
import { defaultMarketingSearch, marketingSearchSchema } from "@ecommerce/contracts/marketing";
import { Marketing, getMarketingScreen } from "@/modules/marketing/contract";
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
  loader: ({ deps }) => getMarketingScreen({ data: deps }),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <Marketing data={data} />;
}

function RouteError() {
  const router = useRouter();
  return (
    <div className={layout.page}>
      <RequestError className="mt-6" onRetry={() => void router.invalidate()} />
    </div>
  );
}
