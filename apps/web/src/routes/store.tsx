import { createFileRoute, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { getStoreActivity } from "@/modules/activity/contract";
import { StoreSettings, getStore } from "@/modules/store/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";

const searchSchema = z.object({ pagina: z.coerce.number().int().min(1).catch(1) });

export const Route = createFileRoute("/loja")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Loja · E-commerce Insights" }, { name: "robots", content: "noindex" }],
  }),
  loaderDeps: ({ search }) => ({ pagina: search.pagina }),
  loader: async ({ deps }) => {
    const [store, activity] = await Promise.all([
      getStore(),
      getStoreActivity({ data: { pagina: deps.pagina, storeId: null } }),
    ]);
    return { store, activity };
  },
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const { store, activity } = Route.useLoaderData();
  const navigate = Route.useNavigate();
  return (
    <StoreSettings
      store={store}
      activity={activity}
      onActivityPage={(pagina) => void navigate({ search: (prev) => ({ ...prev, pagina }) })}
    />
  );
}

function RouteError() {
  const router = useRouter();
  return (
    <div className={layout.page}>
      <RequestError className="mt-6" onRetry={() => void router.invalidate()} />
    </div>
  );
}
