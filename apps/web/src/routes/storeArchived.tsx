import { createFileRoute } from "@tanstack/react-router";
import { StoreArchived } from "@/modules/store/contract";

export const Route = createFileRoute("/loja-arquivada")({
  head: () => ({
    meta: [
      { title: "Loja arquivada · E-commerce Insights" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { session } = Route.useRouteContext();
  return <StoreArchived storeName={session?.activeStore?.name ?? "Sua loja"} />;
}
