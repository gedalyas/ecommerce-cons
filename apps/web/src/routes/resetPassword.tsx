import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ResetPassword } from "@/modules/auth/contract";

const searchSchema = z.object({ token: z.string().catch("") });

export const Route = createFileRoute("/redefinir-senha")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Nova senha · E-commerce Insights" }, { name: "robots", content: "noindex" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { token } = Route.useSearch();
  return <ResetPassword token={token} />;
}
