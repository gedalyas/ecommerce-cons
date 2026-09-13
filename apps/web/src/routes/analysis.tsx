import { createFileRoute, stripSearchParams, useRouter } from "@tanstack/react-router";
import { analysisSearchSchema, defaultAnalysisSearch } from "@ecommerce/contracts/analysis";
import { Analysis, getAnalysisScreen } from "@/modules/analysis/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";

export const Route = createFileRoute("/metricas")({
  validateSearch: analysisSearchSchema,
  search: { middlewares: [stripSearchParams(defaultAnalysisSearch)] },
  head: () => ({
    meta: [
      { title: "Métricas · Loja Aurora | Diagnóstico por métrica" },
      {
        name: "description",
        content:
          "Diagnóstico de uma métrica da Loja Aurora: veredito, comparação, série temporal e os drivers que explicam o resultado.",
      },
      { property: "og:title", content: "Métricas · Loja Aurora" },
    ],
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getAnalysisScreen({ data: deps }),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <Analysis data={data} />;
}

function RouteError() {
  const router = useRouter();
  return (
    <div className={layout.page}>
      <RequestError className="mt-6" onRetry={() => void router.invalidate()} />
    </div>
  );
}
