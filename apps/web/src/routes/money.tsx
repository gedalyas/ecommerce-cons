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
      { title: "Dinheiro · Loja Aurora | Margem, custos e caixa" },
      {
        name: "description",
        content:
          "Pilares de Dinheiro da Loja Aurora: organização financeira, custos e taxas, DRE gerencial e o cadastro de custos que alimenta as margens.",
      },
      { property: "og:title", content: "Dinheiro · Loja Aurora" },
      {
        property: "og:description",
        content: "Margem, custos, taxas, DRE e caixa da Loja Aurora com recomendações em aberto.",
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
