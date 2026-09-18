import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { adminUsersSearchSchema } from "@ecommerce/contracts/admin";
import { AdminAccess, getAdminUsers } from "@/modules/admin/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";

export const Route = createFileRoute("/admin/acesso")({
  validateSearch: adminUsersSearchSchema,
  head: () => ({
    meta: [{ title: "Acesso a usuários · Administração · E-commerce Insights" }],
  }),
  beforeLoad: ({ context }) => {
    if (context.session?.user.role !== "ADMIN") throw redirect({ to: "/admin" });
  },
  loader: () => getAdminUsers(),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  const search = Route.useSearch();
  const { session } = Route.useRouteContext();
  return <AdminAccess data={data} search={search} currentUserId={session?.user.id ?? ""} />;
}

function RouteError() {
  const router = useRouter();
  return (
    <div className={layout.page}>
      <RequestError className="mt-6" onRetry={() => void router.invalidate()} />
    </div>
  );
}
