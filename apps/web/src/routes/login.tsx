import { createFileRoute, redirect } from "@tanstack/react-router";
import { Login, getSessionState } from "@/modules/auth/contract";

export const Route = createFileRoute("/entrar")({
  head: () => ({
    meta: [
      { title: "Entrar · E-commerce Insights" },
      { name: "description", content: "Acesse o painel da sua loja." },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    if (await getSessionState()) throw redirect({ to: "/" });
  },
  component: Login,
});
