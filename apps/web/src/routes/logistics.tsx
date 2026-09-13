import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Logistics, getLogisticsScreen } from "@/modules/logistics/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";

export const Route = createFileRoute("/logistica")({
  head: () => ({
    meta: [
      { title: "Logística · E-commerce Insights" },
      {
        name: "description",
        content:
          "Pilares de Logística da loja: estoque e fulfillment, frete e entrega, SAC e pós-venda com indicadores de prazo.",
      },
      { property: "og:title", content: "Logística · E-commerce Insights" },
      {
        property: "og:description",
        content: "Ruptura de estoque, prazo de entrega e pós-venda da loja em um só lugar.",
      },
    ],
  }),
  loader: () => getLogisticsScreen(),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <Logistics data={data} />;
}

function RouteError() {
  const router = useRouter();
  return (
    <div className={layout.page}>
      <RequestError className="mt-6" onRetry={() => void router.invalidate()} />
    </div>
  );
}
