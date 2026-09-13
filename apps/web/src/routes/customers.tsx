import { createFileRoute, stripSearchParams, useRouter } from "@tanstack/react-router";
import { customersSearchSchema, defaultCustomersSearch } from "@ecommerce/contracts/customers";
import { Customers, getCustomersScreen } from "@/modules/customers/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";

export const Route = createFileRoute("/clientes")({
  validateSearch: customersSearchSchema,
  search: { middlewares: [stripSearchParams(defaultCustomersSearch)] },
  head: () => ({
    meta: [
      { title: "Clientes · E-commerce Insights" },
      {
        name: "description",
        content:
          "Clientes da loja: segmentação RFM com filtros acionáveis, recompra por ordem de compra e a economia unitária da aquisição (LTV e CAC).",
      },
      { property: "og:title", content: "Clientes · E-commerce Insights" },
    ],
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getCustomersScreen({ data: deps }),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <Customers data={data} />;
}

function RouteError() {
  const router = useRouter();
  return (
    <div className={layout.page}>
      <RequestError className="mt-6" onRetry={() => void router.invalidate()} />
    </div>
  );
}
