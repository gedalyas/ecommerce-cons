import { createFileRoute } from "@tanstack/react-router";
import { SectionPage } from "@/components/SectionPage";

export const Route = createFileRoute("/logistica")({
  head: () => ({
    meta: [
      { title: "Logística · Loja Aurora | Estoque, frete e pós-venda" },
      {
        name: "description",
        content:
          "Pilares de Logística da Loja Aurora: estoque e fulfillment, frete e entrega, SAC e pós-venda com indicadores de prazo.",
      },
      { property: "og:title", content: "Logística · Loja Aurora" },
      {
        property: "og:description",
        content: "Ruptura de estoque, prazo de entrega e pós-venda da Loja Aurora em um só lugar.",
      },
    ],
  }),
  component: () => <SectionPage slug="logistica" />,
});
