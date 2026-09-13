import { createFileRoute, useRouter } from "@tanstack/react-router";
import { StoreSettings, getStore } from "@/modules/store/contract";
import { RequestError } from "@/shared/ui/RequestError";
import { layout } from "@/shared/styles/spacing";

export const Route = createFileRoute("/loja")({
  head: () => ({
    meta: [{ title: "Loja · E-commerce Insights" }, { name: "robots", content: "noindex" }],
  }),
  loader: () => getStore(),
  component: RouteComponent,
  errorComponent: RouteError,
});

function RouteComponent() {
  const store = Route.useLoaderData();
  return <StoreSettings store={store} />;
}

function RouteError() {
  const router = useRouter();
  return (
    <div className={layout.page}>
      <RequestError className="mt-6" onRetry={() => void router.invalidate()} />
    </div>
  );
}
