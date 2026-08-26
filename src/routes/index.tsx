import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Loja Aurora | Consultoria de e-commerce" },
      {
        name: "description",
        content:
          "Painel de consultoria de e-commerce da Loja Aurora: faturamento, margem, CAC, recompra, alertas e marco de maturidade.",
      },
      { property: "og:title", content: "Dashboard · Loja Aurora" },
      {
        property: "og:description",
        content: "Faturamento, margem, CAC e recompra da Loja Aurora em um só painel de consultoria.",
      },
    ],
  }),
  component: DashboardPage,
});
