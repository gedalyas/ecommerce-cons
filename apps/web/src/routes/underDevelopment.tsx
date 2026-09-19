import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  UNDER_DEVELOPMENT_LABEL,
  screenReleaseOf,
  storeScreenLabel,
  underDevelopmentSearchSchema,
} from "@ecommerce/contracts/auth";
import { UnderDevelopment } from "@/shared/layout/UnderDevelopment";
import {
  isPathReleased,
  pathOfUnderDevelopmentSlug,
  screenOfPath,
} from "@/shared/layout/screenAccess";

export const Route = createFileRoute("/em-desenvolvimento")({
  validateSearch: underDevelopmentSearchSchema,
  head: () => ({
    meta: [
      { title: `${UNDER_DEVELOPMENT_LABEL} · E-commerce Insights` },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: ({ context, search }) => {
    const pathname = pathOfUnderDevelopmentSlug(search.tela);
    if (!pathname || !context.session) throw redirect({ to: "/" });
    const { user, activeStore } = context.session;
    if (isPathReleased(pathname, screenReleaseOf(user, activeStore))) {
      throw redirect({ to: pathname });
    }
    return { screen: screenOfPath[pathname] ?? null };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { screen } = Route.useRouteContext();
  return <UnderDevelopment title={screen ? storeScreenLabel[screen] : UNDER_DEVELOPMENT_LABEL} />;
}
