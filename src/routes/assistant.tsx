import { createFileRoute } from "@tanstack/react-router";
import { AssistantPage } from "@/features/assistant";

export const Route = createFileRoute("/assistente")({
  head: () => ({
    meta: [
      { title: "Assistente · Loja Aurora | Conversa com IA sobre seus números" },
      {
        name: "description",
        content:
          "Converse sobre os números da Loja Aurora, envie arquivos e grave áudios para analisar margem, criativos e taxas.",
      },
      { property: "og:title", content: "Assistente · Loja Aurora" },
      {
        property: "og:description",
        content: "Conversa longa com a IA da consultoria: margem, criativos, taxas e reuniões.",
      },
    ],
  }),
  component: AssistantPage,
});
