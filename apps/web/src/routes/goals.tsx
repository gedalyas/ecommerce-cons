import { createFileRoute, stripSearchParams, useRouter } from "@tanstack/react-router";
import { defaultGoalsSearch, goalsSearchSchema } from "@ecommerce/contracts/goals";
import { Goals, getGoalsScreen } from "@/modules/goals/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";

export const Route = createFileRoute("/metas")({
  validateSearch: goalsSearchSchema,
  search: { middlewares: [stripSearchParams(defaultGoalsSearch)] },
  head: () => ({
    meta: [
      { title: "Metas · Loja Aurora | Realizado × meta e planejamento" },
      {
        name: "description",
        content:
          "Metas da Loja Aurora: realizado contra meta com caminho para a meta, e o planejamento anual com seis direcionadores por mês.",
      },
      { property: "og:title", content: "Metas · Loja Aurora" },
    ],
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getGoalsScreen({ data: deps }),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <Goals data={data} />;
}

function RouteError() {
  const router = useRouter();
  return (
    <div className={layout.page}>
      <RequestError className="mt-6" onRetry={() => void router.invalidate()} />
    </div>
  );
}
