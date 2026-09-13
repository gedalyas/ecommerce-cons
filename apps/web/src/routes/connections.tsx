import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Connections, getConnectionsScreen } from "@/modules/connections/contract";
import { getImportsScreen } from "@/modules/imports/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";

export const Route = createFileRoute("/conexoes")({
  head: () => ({
    meta: [
      { title: "Conexões · Loja Aurora | Fontes de dados integradas" },
      {
        name: "description",
        content:
          "Status das fontes de dados da Loja Aurora: ERP, plataforma, mídia paga, analytics e importação manual de planilhas.",
      },
      { property: "og:title", content: "Conexões · Loja Aurora" },
      {
        property: "og:description",
        content:
          "Fontes ativas, sincronizações, erros de autenticação e importação manual da Loja Aurora.",
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
