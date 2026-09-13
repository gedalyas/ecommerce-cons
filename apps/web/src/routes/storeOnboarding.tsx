import { createFileRoute } from "@tanstack/react-router";
import { StoreOnboarding } from "@/modules/store/contract";

export const Route = createFileRoute("/configurar-loja")({
  head: () => ({
    meta: [
      { title: "Configurar loja · E-commerce Insights" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: StoreOnboarding,
});
