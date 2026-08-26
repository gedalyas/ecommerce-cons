import { createFileRoute } from "@tanstack/react-router";
import { SectionPage } from "@/components/SectionPage";

export const Route = createFileRoute("/gestao")({
  head: () => ({
    meta: [
      { title: "Gestão · Loja Aurora | Risco, delegação e tecnologia" },
      {
        name: "description",
        content:
          "Pilares de Gestão da Loja Aurora: blindagem contra concentração de receita, delegação de processos e tecnologia.",
      },
      { property: "og:title", content: "Gestão · Loja Aurora" },
      {
        property: "og:description",
        content: "Concentração de receita, meses de caixa e delegação de processos da Loja Aurora.",
      },
    ],
  }),
  component: () => <SectionPage slug="gestao" />,
});
