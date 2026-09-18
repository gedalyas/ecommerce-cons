import { createFileRoute, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { getStaffActivity } from "@/modules/activity/contract";
import { Admin, getAdminScreen } from "@/modules/admin/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";

const searchSchema = z.object({
  loja: z.string().catch(""),
  pagina: z.coerce.number().int().min(1).catch(1),
});

export const Route = createFileRoute("/admin/")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Administração · E-commerce Insights" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loaderDeps: ({ search }) => ({ loja: search.loja, pagina: search.pagina }),
  loader: async ({ deps }) => {
    const [screen, activity] = await Promise.all([
      getAdminScreen(),
      getStaffActivity({ data: { pagina: deps.pagina, storeId: deps.loja || null } }),
    ]);
    return { screen, activity };
  },
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const { screen, activity } = Route.useLoaderData();
  const { loja } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <Admin
      data={screen}
      activity={activity}
      activityStoreId={loja}
      onActivityChange={(next) =>
        void navigate({ search: (prev) => ({ ...prev, ...next }), replace: true })
      }
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
