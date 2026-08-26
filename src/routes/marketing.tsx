import { createFileRoute } from "@tanstack/react-router";
import { MarketingPage } from "@/features/marketing";

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
        content: "CAC, ROAS, conversão e retenção da Loja Aurora com alertas de dados desatualizados.",
      },
    ],
  }),
  component: MarketingPage,
});
