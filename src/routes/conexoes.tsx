import { createFileRoute } from "@tanstack/react-router";
import { ConexoesPage } from "@/features/conexoes";

export const Route = createFileRoute("/conexoes")({
  head: () => ({
    meta: [
      { title: "Conexões · Loja Aurora | Fontes de dados integradas" },
      {
        name: "description",
        content:
          "Status das fontes de dados da Loja Aurora: ERP, plataforma, mídia paga, analytics e importação manual de planilhas.",
      },
      { property: "og:title", content: "Conexões · Loja Aurora" },
      {
        property: "og:description",
        content: "5 de 7 fontes ativas: veja sincronizações, erros de autenticação e importação manual.",
      },
    ],
  }),
  component: ConexoesPage,
});
