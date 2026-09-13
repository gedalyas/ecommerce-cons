import { createFileRoute, stripSearchParams, useRouter } from "@tanstack/react-router";
import { defaultMoneySearch, moneySearchSchema } from "@ecommerce/contracts/money";
import { Money, getMoneyScreen } from "@/modules/money/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";

export const Route = createFileRoute("/dinheiro")({
  validateSearch: moneySearchSchema,
  search: { middlewares: [stripSearchParams(defaultMoneySearch)] },
  head: () => ({
    meta: [
      { title: "Dinheiro · E-commerce Insights" },
      {
        name: "description",
        content:
          "Pilares de Dinheiro da loja: organização financeira, custos e taxas, DRE gerencial e o cadastro de custos que alimenta as margens.",
      },
      { property: "og:title", content: "Dinheiro · E-commerce Insights" },
      {
        property: "og:description",
        content: "Margem, custos, taxas, DRE e caixa da loja com recomendações em aberto.",
      },
    ],
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getMoneyScreen({ data: deps }),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <Money data={data} />;
}

function RouteError() {
  const router = useRouter();
  return (
    <div className={layout.page}>
      <RequestError className="mt-6" onRetry={() => void router.invalidate()} />
    </div>
  );
}
