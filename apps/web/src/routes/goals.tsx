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
      { title: "Metas · E-commerce Insights" },
      {
        name: "description",
        content:
          "Metas da loja: realizado contra meta com caminho para a meta, e o planejamento anual com seis direcionadores por mês.",
      },
      { property: "og:title", content: "Metas · E-commerce Insights" },
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
