import { createFileRoute, Link, stripSearchParams, useRouter } from "@tanstack/react-router";
import {
  defaultIntegrationPageSearch,
  integrationPageSearchSchema,
} from "@ecommerce/contracts/connections";
import { connectorCatalog } from "@ecommerce/contracts/connectors";
import { getConnectionsScreen, IntegrationPage } from "@/modules/connections/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";

export const Route = createFileRoute("/integracoes/$chave")({
  validateSearch: integrationPageSearchSchema,
  search: { middlewares: [stripSearchParams(defaultIntegrationPageSearch)] },
  head: ({ params }) => {
    const label = connectorCatalog.find((c) => c.key === params.chave)?.label ?? "Integração";
    return {
      meta: [
        { title: `${label} · Integrações · E-commerce Insights` },
        {
          name: "description",
          content: `Conexão, dados trazidos, configurações e ajuda da integração com ${label}.`,
        },
      ],
    };
  },
  loader: async () => ({ screen: await getConnectionsScreen() }),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const { screen } = Route.useLoaderData();
  const { chave } = Route.useParams();
  const connector = screen.connectors.find((c) => c.key === chave) ?? null;
  if (!connector) {
    return (
      <div className={cn(layout.page, layout.headerGap)}>
        <p className={cn(textClass.body, "text-foreground")}>
          Integração não encontrada.{" "}
          <Link
            to="/integracoes"
            className="font-semibold text-primary underline underline-offset-2"
          >
            Ver todas as integrações
          </Link>
        </p>
      </div>
    );
  }
  return <IntegrationPage key={connector.key} connector={connector} screen={screen} />;
}

function RouteError() {
  const router = useRouter();
  return (
    <div className={layout.page}>
      <RequestError className="mt-6" onRetry={() => void router.invalidate()} />
    </div>
  );
}
