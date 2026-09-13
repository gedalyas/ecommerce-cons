import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Management, getManagementScreen } from "@/modules/management/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";

export const Route = createFileRoute("/gestao")({
  head: () => ({
    meta: [
      { title: "Gestão · E-commerce Insights" },
      {
        name: "description",
        content:
          "Pilares de Gestão da loja: blindagem contra concentração de receita, delegação de processos e tecnologia.",
      },
      { property: "og:title", content: "Gestão · E-commerce Insights" },
      {
        property: "og:description",
        content: "Concentração de receita, meses de caixa e delegação de processos da loja.",
      },
    ],
  }),
  loader: () => getManagementScreen(),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <Management data={data} />;
}

function RouteError() {
  const router = useRouter();
  return (
    <div className={layout.page}>
      <RequestError className="mt-6" onRetry={() => void router.invalidate()} />
    </div>
  );
}
