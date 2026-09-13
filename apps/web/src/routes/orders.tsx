import { createFileRoute, stripSearchParams, useRouter } from "@tanstack/react-router";
import { defaultOrdersSearch, ordersSearchSchema } from "@ecommerce/contracts/orders";
import { Orders, getOrdersScreen } from "@/modules/orders/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";

export const Route = createFileRoute("/pedidos")({
  validateSearch: ordersSearchSchema,
  search: { middlewares: [stripSearchParams(defaultOrdersSearch)] },
  head: () => ({
    meta: [
      { title: "Pedidos · Loja Aurora | Captura, aprovação e lista" },
      {
        name: "description",
        content:
          "Pedidos da Loja Aurora: receita capturada e paga, taxa de aprovação por status, método e gateway, e a lista transacional com custo e margem.",
      },
      { property: "og:title", content: "Pedidos · Loja Aurora" },
    ],
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getOrdersScreen({ data: deps }),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <Orders data={data} />;
}

function RouteError() {
  const router = useRouter();
  return (
    <div className={layout.page}>
      <RequestError className="mt-6" onRetry={() => void router.invalidate()} />
    </div>
  );
}
