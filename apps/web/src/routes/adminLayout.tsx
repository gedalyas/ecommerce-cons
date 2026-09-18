import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AdminShell } from "@/modules/admin/contract";
import { logoutFn } from "@/modules/auth/contract";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração · E-commerce Insights" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { session } = Route.useRouteContext();
  const router = useRouter();
  const navigate = useNavigate();
  const logout = useServerFn(logoutFn);
  if (!session) return null;

  const signOut = async () => {
    await logout();
    await router.invalidate();
    await navigate({ to: "/entrar" });
  };

  return (
    <AdminShell
      account={{
        name: session.user.name,
        isAdmin: session.user.role === "ADMIN",
        hasStore: session.activeStore !== null,
        onSignOut: () => void signOut(),
      }}
    />
  );
}
