import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Connections, getConnectionsScreen } from "@/modules/connections/contract";
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
  loader: () => getConnectionsScreen(),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <Connections data={data} />;
}

function RouteError() {
  const router = useRouter();
  return (
    <div className={layout.page}>
      <RequestError className="mt-6" onRetry={() => void router.invalidate()} />
    </div>
  );
}
