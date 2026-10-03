import { createFileRoute } from "@tanstack/react-router";
import { Assistant } from "@/modules/assistant/contract";

export const Route = createFileRoute("/assistente")({
  head: () => ({
    meta: [
      { title: "Assistente · E-commerce Insights" },
      {
        name: "description",
        content:
          "Pergunte sobre os números da loja: vendas, margem, canais, produtos, clientes e metas.",
      },
      { property: "og:title", content: "Assistente · E-commerce Insights" },
      {
        property: "og:description",
        content: "Respostas com os números reais da loja e as ressalvas de cada fonte.",
      },
    ],
  }),
  component: Assistant,
});
