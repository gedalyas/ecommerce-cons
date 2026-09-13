import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Dashboard, getDashboardOverview } from "@/modules/dashboard/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · E-commerce Insights" },
      {
        name: "description",
        content:
          "Painel de consultoria de e-commerce da loja: faturamento, margem, CAC, recompra, alertas e marco de maturidade.",
      },
      { property: "og:title", content: "Dashboard · E-commerce Insights" },
      {
        property: "og:description",
        content: "Faturamento, margem, CAC e recompra da loja em um só painel de consultoria.",
      },
    ],
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getDashboardOverview({ data: deps }),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <Dashboard data={data} />;
}

function RouteError() {
  const router = useRouter();
  return (
    <div className={layout.page}>
      <RequestError className="mt-6" onRetry={() => void router.invalidate()} />
    </div>
  );
}
