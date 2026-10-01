import { createFileRoute, redirect } from "@tanstack/react-router";
import { integrationsSearchSchema } from "@ecommerce/contracts/connections";

export const Route = createFileRoute("/conexoes")({
  validateSearch: integrationsSearchSchema,
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/integracoes", search, replace: true });
  },
});
