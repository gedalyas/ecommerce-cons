import { createFileRoute, stripSearchParams, useRouter } from "@tanstack/react-router";
import {
  defaultInfluencersSearch,
  influencersSearchSchema,
} from "@ecommerce/contracts/influencers";
import { Influencers, getInfluencersScreen } from "@/modules/influencers/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";

export const Route = createFileRoute("/influenciadores")({
  validateSearch: influencersSearchSchema,
  search: { middlewares: [stripSearchParams(defaultInfluencersSearch)] },
  head: () => ({
    meta: [
      { title: "Influenciadores · E-commerce Insights" },
      {
        name: "description",
        content:
          "Hub de influenciadores da loja: cadastro de parcerias, regras de remuneração, cupons e o ROI de cada uma.",
      },
      { property: "og:title", content: "Influenciadores · E-commerce Insights" },
    ],
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getInfluencersScreen({ data: deps }),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <Influencers data={data} />;
}

function RouteError() {
  const router = useRouter();
  return (
    <div className={layout.page}>
      <RequestError className="mt-6" onRetry={() => void router.invalidate()} />
    </div>
  );
}
