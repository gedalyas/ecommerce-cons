import { createFileRoute, useRouter } from "@tanstack/react-router";
import { getRetentionSummary } from "@/modules/customers/contract";
import { Marketing } from "@/modules/marketing/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";

export const Route = createFileRoute("/marketing")({
  head: () => ({
    meta: [
      { title: "Marketing · Loja Aurora | CAC, conversão e retenção" },
      {
        name: "description",
        content:
          "Pilares de Marketing da Loja Aurora: conversão, aquisição, retenção e canais paralelos, com CAC, ROAS e recompra.",
      },
      { property: "og:title", content: "Marketing · Loja Aurora" },
      {
        property: "og:description",
        content:
          "CAC, ROAS, conversão e retenção da Loja Aurora com alertas de dados desatualizados.",
      },
    ],
  }),
  // The composition root feeds the Retenção pillar from the customers module.
  loader: () => getRetentionSummary(),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <Marketing retention={data} />;
}

function RouteError() {
  const router = useRouter();
  return (
    <div className={layout.page}>
      <RequestError className="mt-6" onRetry={() => void router.invalidate()} />
    </div>
  );
}
