import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { Register, getSessionState } from "@/modules/auth/contract";

const searchSchema = z.object({ email: z.string().catch("") });

export const Route = createFileRoute("/cadastro")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Criar conta · E-commerce Insights" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: async () => {
    if (await getSessionState()) throw redirect({ to: "/" });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { email } = Route.useSearch();
  return <Register email={email} />;
}
