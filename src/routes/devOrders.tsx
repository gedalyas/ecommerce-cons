import { createFileRoute } from "@tanstack/react-router";
import { getOrdersOverview, OrdersDev } from "@/modules/orders/contract";

export const Route = createFileRoute("/dev/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos por data (dev) · Loja Aurora" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getOrdersOverview({ data: deps }),
  component: RouteComponent,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <OrdersDev data={data} />;
}
