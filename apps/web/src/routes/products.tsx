import { createFileRoute, stripSearchParams, useRouter } from "@tanstack/react-router";
import {
  Products,
  defaultProductsSearch,
  getProductsScreen,
  productsSearchSchema,
} from "@/modules/products/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";

export const Route = createFileRoute("/produtos")({
  validateSearch: productsSearchSchema,
  search: { middlewares: [stripSearchParams(defaultProductsSearch)] },
  head: () => ({
    meta: [
      { title: "Produtos · Loja Aurora | Vendas, curva ABC e estoque" },
      {
        name: "description",
        content:
          "Produtos da Loja Aurora: mais e menos vendidos, curva ABC, risco de estoque, rupturas e a posição de estoque por variante.",
      },
      { property: "og:title", content: "Produtos · Loja Aurora" },
    ],
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getProductsScreen({ data: deps }),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <Products data={data} />;
}

function RouteError() {
  const router = useRouter();
  return (
    <div className={layout.page}>
      <RequestError className="mt-6" onRetry={() => void router.invalidate()} />
    </div>
  );
}
