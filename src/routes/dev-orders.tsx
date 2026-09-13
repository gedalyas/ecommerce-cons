import { createFileRoute } from "@tanstack/react-router";
import { getOrdersOverview } from "@/features/orders/api";
import { OrdersDevPage } from "@/features/orders/dev";

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
  return <OrdersDevPage data={data} />;
}
