import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Admin, getAdminScreen } from "@/modules/admin/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração · E-commerce Insights" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: () => getAdminScreen(),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <Admin data={data} />;
}

function RouteError() {
  const router = useRouter();
  return (
    <div className={layout.page}>
      <RequestError className="mt-6" onRetry={() => void router.invalidate()} />
    </div>
  );
}
