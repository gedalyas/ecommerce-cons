import { createFileRoute, redirect } from "@tanstack/react-router";
import { ForgotPassword, getSessionState } from "@/modules/auth/contract";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => ({
    meta: [
      { title: "Esqueci minha senha · E-commerce Insights" },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async () => {
    if (await getSessionState()) throw redirect({ to: "/" });
  },
  component: ForgotPassword,
});
