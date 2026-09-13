import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { Register, getInvitation, getSessionState } from "@/modules/auth/contract";

const searchSchema = z.object({ convite: z.string().catch("") });

export const Route = createFileRoute("/cadastro")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Criar conta · E-commerce Insights" }, { name: "robots", content: "noindex" }],
  }),
  beforeLoad: async () => {
    if (await getSessionState()) throw redirect({ to: "/" });
  },
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) =>
    deps.convite
      ? getInvitation({ data: { token: deps.convite } })
      : {
          ok: false as const,
          message: "Abra o link que você recebeu por e-mail para criar sua conta.",
        },
  component: RouteComponent,
});

function RouteComponent() {
  const { convite } = Route.useSearch();
  const invitation = Route.useLoaderData();
  return <Register token={convite} invitation={invitation} />;
}
