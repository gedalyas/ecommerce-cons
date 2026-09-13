import { createFileRoute, redirect } from "@tanstack/react-router";
import { Login, getSessionUser } from "@/modules/auth/contract";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar · E-commerce Insights" },
      { name: "description", content: "Acesse o painel de consultoria de e-commerce." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    if (await getSessionUser()) throw redirect({ to: "/" });
  },
  component: Login,
});
