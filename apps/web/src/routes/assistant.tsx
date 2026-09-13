import { createFileRoute } from "@tanstack/react-router";
import { Assistant } from "@/modules/assistant/contract";

export const Route = createFileRoute("/assistente")({
  head: () => ({
    meta: [
      { title: "Assistente · E-commerce Insights" },
      {
        name: "description",
        content:
          "Converse sobre os números da loja, envie arquivos e grave áudios para analisar margem, criativos e taxas.",
      },
      { property: "og:title", content: "Assistente · E-commerce Insights" },
      {
        property: "og:description",
        content: "Conversa longa com a IA da consultoria: margem, criativos, taxas e reuniões.",
      },
    ],
  }),
  component: Assistant,
});
