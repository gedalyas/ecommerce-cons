import { createFileRoute } from "@tanstack/react-router";
import { MoneyPage } from "@/features/money";

export const Route = createFileRoute("/dinheiro")({
  head: () => ({
    meta: [
      { title: "Dinheiro · Loja Aurora | Margem, custos e caixa" },
      {
        name: "description",
        content:
          "Pilares de Dinheiro da Loja Aurora: organização financeira, custos e taxas, margem de contribuição e ciclo de caixa.",
      },
      { property: "og:title", content: "Dinheiro · Loja Aurora" },
      {
        property: "og:description",
        content: "Margem, custos, taxas e caixa da Loja Aurora com recomendações em aberto.",
      },
    ],
  }),
  component: MoneyPage,
});
