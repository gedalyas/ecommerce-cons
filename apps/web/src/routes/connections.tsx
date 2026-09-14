import { createFileRoute, useRouter } from "@tanstack/react-router";
import { z } from "zod";
import { connectorErrorReasons } from "@ecommerce/contracts/connectors";
import { Connections, getConnectionsScreen } from "@/modules/connections/contract";
import { getImportsScreen } from "@/modules/imports/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";

const searchSchema = z.object({
  conectado: z.string().catch(""),
  escolher: z.boolean().catch(false),
  erro: z.string().catch(""),
  motivo: z.enum(connectorErrorReasons).catch("troca"),
});

export const Route = createFileRoute("/conexoes")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Conexões · E-commerce Insights" },
      {
        name: "description",
        content:
          "Status das fontes de dados da loja: ERP, plataforma, mídia paga, analytics e importação manual de planilhas.",
      },
      { property: "og:title", content: "Conexões · E-commerce Insights" },
      {
        property: "og:description",
        content:
          "Fontes ativas, sincronizações, erros de autenticação e importação manual da loja.",
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
  const { conectado, escolher, erro, motivo } = Route.useSearch();
  return (
    <Connections
      data={data}
      imports={imports}
      justConnected={conectado}
      chooseAccount={escolher}
      failed={erro}
      failureReason={motivo}
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
