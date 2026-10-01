import { createFileRoute, stripSearchParams, useRouter } from "@tanstack/react-router";
import {
  defaultIntegrationsSearch,
  integrationsSearchSchema,
} from "@ecommerce/contracts/connections";
import { Connections, getConnectionsScreen } from "@/modules/connections/contract";
import { getImportsScreen } from "@/modules/imports/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";

export const Route = createFileRoute("/integracoes")({
  validateSearch: integrationsSearchSchema,
  search: { middlewares: [stripSearchParams(defaultIntegrationsSearch)] },
  head: () => ({
    meta: [
      { title: "Integrações · E-commerce Insights" },
      {
        name: "description",
        content:
          "Integrações da loja: ERP, plataforma, marketplaces, anúncios, analytics e importação de planilhas.",
      },
      { property: "og:title", content: "Integrações · E-commerce Insights" },
      {
        property: "og:description",
        content:
          "Catálogo de integrações por categoria, as integrações da loja com status e sincronização, e as planilhas.",
      },
    ],
  }),
  loader: async () => {
    const [data, imports] = await Promise.all([getConnectionsScreen(), getImportsScreen()]);
    return { data, imports };
  },
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const { data, imports } = Route.useLoaderData();
  return <Connections data={data} imports={imports} />;
}

function RouteError() {
  const router = useRouter();
  return (
    <div className={layout.page}>
      <RequestError className="mt-6" onRetry={() => void router.invalidate()} />
    </div>
  );
}
